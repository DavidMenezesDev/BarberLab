#!/usr/bin/env bash
# Prepara uma VPS ZERADA (Ubuntu 22.04/24.04 ou Debian 12) para rodar o BarberLab em produção.
#
# Instala e configura: swap, firewall (ufw), fail2ban, atualizações automáticas de segurança,
# Node 22, PostgreSQL, Caddy (HTTPS automático), serviço systemd, backup diário do banco
# e o comando `barberlab-deploy` para publicar novas versões.
#
# Uso (como root, na VPS):
#   DOMAIN=app.seudominio.com.br ACME_EMAIL=voce@email.com \
#   REPO_URL=git@github.com:DavidMenezesDev/BarberLab.git \
#   bash setup-vps.sh
#
# Variáveis (as que faltarem são perguntadas):
#   DOMAIN               domínio público (o DNS A/AAAA já deve apontar para esta VPS)
#   ACME_EMAIL           e-mail para o certificado Let's Encrypt
#   REPO_URL             repositório git (padrão: git@github.com:DavidMenezesDev/BarberLab.git)
#   BRANCH               branch a publicar (padrão: main)
#   SUPER_ADMIN_EMAIL    e-mail do super admin da plataforma (opcional)
#   SUPER_ADMIN_NAME     nome do super admin (opcional)
#   SUPER_ADMIN_PASSWORD senha do super admin (opcional; gerada se o e-mail for informado)
#
# É idempotente: pode ser executado de novo sem apagar banco, .env nem segredos.

set -euo pipefail

APP_USER="barberlab"
APP_HOME="/opt/barberlab"
APP_DIR="$APP_HOME/app"
ENV_FILE="$APP_HOME/.env"
BACKUP_DIR="/var/backups/barberlab"
DB_NAME="barberlab"
DB_USER="barberlab"
APP_PORT="3000"
NODE_MAJOR="22"

REPO_URL="${REPO_URL:-git@github.com:DavidMenezesDev/BarberLab.git}"
BRANCH="${BRANCH:-main}"

log() { printf '\n\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[aviso]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[erro]\033[0m %s\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Execute como root (sudo -i)."
[[ -r /etc/os-release ]] && . /etc/os-release
case "${ID:-}" in
  ubuntu|debian) ;;
  *) die "Sistema não suportado (${ID:-?}). Use Ubuntu 22.04/24.04 ou Debian 12." ;;
esac

export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------- parâmetros
if [[ -z "${DOMAIN:-}" ]]; then read -rp "Domínio (ex: app.seudominio.com.br): " DOMAIN; fi
[[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || die "Domínio inválido: '$DOMAIN'"
if [[ -z "${ACME_EMAIL:-}" ]]; then read -rp "E-mail para o certificado HTTPS: " ACME_EMAIL; fi
[[ "$ACME_EMAIL" == *@*.* ]] || die "E-mail inválido."

PUBLIC_IP="$(curl -fsS4 https://ifconfig.me 2>/dev/null || true)"
DNS_IP="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
if [[ -n "$PUBLIC_IP" && "$PUBLIC_IP" != "$DNS_IP" ]]; then
  warn "O DNS de $DOMAIN aponta para '${DNS_IP:-nada}', mas esta VPS é $PUBLIC_IP."
  warn "O certificado HTTPS só sai depois que o DNS estiver correto (o Caddy tenta de novo sozinho)."
fi

# ---------------------------------------------------------------- pacotes base
log "Atualizando o sistema e instalando pacotes base"
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates curl gnupg git build-essential openssl ufw fail2ban \
  unattended-upgrades apt-transport-https debian-keyring debian-archive-keyring \
  cron logrotate

# ---------------------------------------------------------------- swap
if ! swapon --show | grep -q .; then
  log "Criando swap de 2G (o build do Next.js precisa de memória)"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-barberlab-swap.conf
  sysctl -p /etc/sysctl.d/99-barberlab-swap.conf >/dev/null
fi

# ---------------------------------------------------------------- segurança
log "Configurando atualizações automáticas, firewall e fail2ban"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Imagens da Oracle Cloud trazem um REJECT no iptables antes das regras do ufw:
# sem isto as portas 80/443 ficam fechadas mesmo com o ufw liberado.
if iptables -S INPUT | grep -q 'REJECT --reject-with icmp-host-prohibited'; then
  for porta in 80 443; do
    iptables -C INPUT -p tcp -m state --state NEW --dport "$porta" -j ACCEPT 2>/dev/null \
      || iptables -I INPUT 5 -p tcp -m state --state NEW --dport "$porta" -j ACCEPT
  done
  apt-get install -y iptables-persistent
  netfilter-persistent save
fi

cat > /etc/fail2ban/jail.d/barberlab.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

# Só desliga senha no SSH se já existir chave autorizada para o root (evita se trancar fora).
SUDO_HOME="$(getent passwd "${SUDO_USER:-root}" | cut -d: -f6)"
if [[ -s /root/.ssh/authorized_keys || -s "$SUDO_HOME/.ssh/authorized_keys" ]]; then
  log "Endurecendo o SSH (somente chave)"
  mkdir -p /etc/ssh/sshd_config.d
  cat > /etc/ssh/sshd_config.d/00-barberlab.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin prohibit-password
EOF
  if sshd -t; then systemctl reload ssh 2>/dev/null || systemctl reload sshd; else
    rm -f /etc/ssh/sshd_config.d/00-barberlab.conf
    warn "sshd -t falhou; configuração de SSH revertida."
  fi
else
  warn "Sem chave SSH em /root/.ssh/authorized_keys: login por senha mantido. Adicione sua chave e rode de novo."
fi

# ---------------------------------------------------------------- Node.js
if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" != "$NODE_MAJOR" ]]; then
  log "Instalando Node.js $NODE_MAJOR"
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

# ---------------------------------------------------------------- PostgreSQL
log "Instalando PostgreSQL"
apt-get install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# ---------------------------------------------------------------- usuário e .env
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir "$APP_HOME" --shell /bin/bash "$APP_USER"
install -d -o "$APP_USER" -g "$APP_USER" -m 750 "$APP_HOME"

if [[ -f "$ENV_FILE" ]]; then
  log "Mantendo $ENV_FILE existente (segredos preservados)"
  set -a; . "$ENV_FILE"; set +a
  DB_PASSWORD="$(sed -n 's#^DATABASE_URL=postgresql://[^:]*:\([^@]*\)@.*#\1#p' "$ENV_FILE")"
else
  log "Gerando segredos e $ENV_FILE"
  DB_PASSWORD="$(openssl rand -hex 24)"
  AUTH_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  {
    echo "NODE_ENV=production"
    echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME"
    echo "NEXTAUTH_URL=https://$DOMAIN"
    echo "NEXTAUTH_SECRET=$AUTH_SECRET"
    if [[ -n "${SUPER_ADMIN_EMAIL:-}" ]]; then
      SA_PASS="${SUPER_ADMIN_PASSWORD:-$(openssl rand -base64 18 | tr -d '\n=+/')}"
      echo "SUPER_ADMIN_EMAIL=$SUPER_ADMIN_EMAIL"
      echo "SUPER_ADMIN_NAME=\"${SUPER_ADMIN_NAME:-Super Admin}\""
      echo "SUPER_ADMIN_PASSWORD=$SA_PASS"
      GENERATED_ADMIN_PASSWORD="$SA_PASS"
    fi
  } > "$ENV_FILE"
  warn "NEXTAUTH_SECRET também cifra as credenciais do WhatsApp no banco: não troque depois."
fi
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

log "Criando banco e usuário do PostgreSQL"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER ROLE $DB_USER PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
SQL
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

# ---------------------------------------------------------------- acesso ao repositório
SSH_DIR="$APP_HOME/.ssh"
install -d -o "$APP_USER" -g "$APP_USER" -m 700 "$SSH_DIR"
if [[ "$REPO_URL" == git@* || "$REPO_URL" == ssh://* ]]; then
  if [[ ! -f "$SSH_DIR/id_ed25519" ]]; then
    sudo -u "$APP_USER" ssh-keygen -t ed25519 -N "" -C "barberlab-deploy@$DOMAIN" -f "$SSH_DIR/id_ed25519" >/dev/null
  fi
  sudo -u "$APP_USER" bash -c "ssh-keyscan -t ed25519 github.com >> '$SSH_DIR/known_hosts' 2>/dev/null; sort -u -o '$SSH_DIR/known_hosts' '$SSH_DIR/known_hosts'"

  if ! sudo -u "$APP_USER" git ls-remote "$REPO_URL" >/dev/null 2>&1; then
    echo
    echo "------------------------------------------------------------------"
    echo "Adicione esta chave como Deploy Key (somente leitura) no GitHub:"
    echo "  Repositório > Settings > Deploy keys > Add deploy key"
    echo
    cat "$SSH_DIR/id_ed25519.pub"
    echo "------------------------------------------------------------------"
    read -rp "Pressione ENTER depois de adicionar a chave..." _
    sudo -u "$APP_USER" git ls-remote "$REPO_URL" >/dev/null || die "Sem acesso ao repositório."
  fi
fi

# ---------------------------------------------------------------- comando de deploy
log "Instalando o comando barberlab-deploy"
cat > /usr/local/bin/barberlab-deploy <<EOF
#!/usr/bin/env bash
# Publica a versão mais recente da branch $BRANCH. Uso: sudo barberlab-deploy [branch]
set -euo pipefail
[[ \$EUID -eq 0 ]] || { echo "Execute como root (sudo)." >&2; exit 1; }
BRANCH="\${1:-$BRANCH}"
APP_USER="$APP_USER"; APP_DIR="$APP_DIR"; APP_HOME="$APP_HOME"
run() { runuser -u "\$APP_USER" -- bash -c "set -euo pipefail; set -a; . '\$APP_HOME/.env'; set +a; export HUSKY=0; cd '\$APP_DIR'; \$1"; }

if [[ ! -d "\$APP_DIR/.git" ]]; then
  runuser -u "\$APP_USER" -- git clone --branch "\$BRANCH" "$REPO_URL" "\$APP_DIR"
else
  run "git fetch --prune origin && git checkout \$BRANCH && git reset --hard origin/\$BRANCH"
fi
ln -sf "\$APP_HOME/.env" "\$APP_DIR/.env"

echo "==> Backup antes de migrar"
/usr/local/bin/barberlab-backup || echo "[aviso] backup falhou (ok na primeira instalação)"

echo "==> Instalando dependências"
run "npm ci --include=dev --no-audit --no-fund"
echo "==> Aplicando migrations"
run "npx prisma migrate deploy"
echo "==> Build"
run "npm run build"

echo "==> Reiniciando serviço"
systemctl restart barberlab
for i in \$(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$APP_PORT/"; then echo "Deploy concluído: no ar."; exit 0; fi
  sleep 2
done
echo "[erro] O app não respondeu. Veja: journalctl -u barberlab -n 100" >&2
exit 1
EOF
chmod 755 /usr/local/bin/barberlab-deploy

# ---------------------------------------------------------------- backup diário
log "Configurando backup diário do banco"
install -d -m 700 "$BACKUP_DIR"
cat > /usr/local/bin/barberlab-backup <<EOF
#!/usr/bin/env bash
set -euo pipefail
install -d -m 700 "$BACKUP_DIR"
out="$BACKUP_DIR/$DB_NAME-\$(date +%F_%H%M%S).sql.gz"
sudo -u postgres pg_dump "$DB_NAME" | gzip > "\$out"
chmod 600 "\$out"
find "$BACKUP_DIR" -name '$DB_NAME-*.sql.gz' -mtime +14 -delete
echo "Backup: \$out"
EOF
chmod 755 /usr/local/bin/barberlab-backup
cat > /etc/cron.d/barberlab-backup <<'EOF'
15 3 * * * root /usr/local/bin/barberlab-backup >> /var/log/barberlab-backup.log 2>&1
EOF

# ---------------------------------------------------------------- systemd
log "Criando o serviço systemd"
cat > /etc/systemd/system/barberlab.service <<EOF
[Unit]
Description=BarberLab (Next.js)
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$APP_DIR/node_modules/.bin/next start -H 127.0.0.1 -p $APP_PORT
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=$APP_HOME

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable barberlab

# ---------------------------------------------------------------- Caddy
if ! command -v caddy >/dev/null; then
  log "Instalando Caddy"
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi
cat > /etc/caddy/Caddyfile <<EOF
{
	email $ACME_EMAIL
}

$DOMAIN {
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		-Server
	}
	reverse_proxy 127.0.0.1:$APP_PORT
}
EOF
systemctl enable caddy
systemctl restart caddy

# ---------------------------------------------------------------- primeiro deploy
log "Primeiro deploy (clone, dependências, migrations e build — leva alguns minutos)"
/usr/local/bin/barberlab-deploy "$BRANCH"

cat <<EOF

==================================================================
 BarberLab no ar: https://$DOMAIN
==================================================================
 Atualizar versão ........ sudo barberlab-deploy
 Logs do app ............. journalctl -u barberlab -f
 Backup manual ........... sudo barberlab-backup   (diário às 03:15, guarda 14 dias em $BACKUP_DIR)
 Variáveis de ambiente ... $ENV_FILE  (depois de editar: systemctl restart barberlab)
EOF
if [[ -n "${GENERATED_ADMIN_PASSWORD:-}" ]]; then
  echo " Super admin ............. $SUPER_ADMIN_EMAIL / $GENERATED_ADMIN_PASSWORD  (troque a senha no 1º login)"
fi
cat <<EOF

 Recomendado: copie os backups para fora da VPS (rclone/scp) e guarde uma cópia
 do $ENV_FILE em local seguro — sem o NEXTAUTH_SECRET as credenciais do WhatsApp
 salvas no banco não podem ser lidas.
EOF
