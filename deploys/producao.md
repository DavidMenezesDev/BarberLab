# Deploy em produção (VPS)

Produção roda em uma VPS Ubuntu: Next.js (systemd) atrás do Caddy (HTTPS automático) com PostgreSQL local.

- Domínio: `https://barber.elitesales.space`
- VPS: Oracle Cloud (arm64), Ubuntu, usuário de acesso `ubuntu`
- Código: `origin/main` do GitHub, clonado em `/opt/barberlab/app`
- Configuração e segredos: `/opt/barberlab/.env` (fora do repositório, permissão 600)

## Atualizar a versão (dia a dia)

1. Commit e push na `main`.
2. Na VPS:

```bash
ssh -i <sua-chave>.key ubuntu@<IP_DA_VPS>
sudo barberlab-deploy
```

O comando faz, nesta ordem: `git fetch` + `reset --hard origin/main`, backup do banco, `npm ci --include=dev`, `prisma migrate deploy`, `npm run build`, reinício do serviço e checagem de que o app respondeu.
Se a checagem falhar, ele sai com erro: veja `journalctl -u barberlab -n 100`.

Só o que está no GitHub é publicado: mudanças sem commit/push não chegam à produção.

## Subir uma VPS zerada

Script: [scripts/deploy/setup-vps.sh](../scripts/deploy/setup-vps.sh). É idempotente (pode rodar de novo sem apagar banco nem `.env`).

### Antes
1. DNS: registro **A** do domínio apontando para o IP da VPS. Com Cloudflare, use SSL **Full (strict)**; para a emissão do certificado, deixe "DNS only" até o HTTPS funcionar.
2. Rede do provedor: libere **TCP 80 e 443** de entrada (`0.0.0.0/0`). Na Oracle: Networking > VCN > Security Lists > Default Security List > Add Ingress Rules. O ufw/iptables da VPS o script já cuida.

### Rodar
```bash
scp -i <chave>.key scripts/deploy/setup-vps.sh ubuntu@<IP>:~/
ssh -i <chave>.key ubuntu@<IP>
sudo DOMAIN=barber.elitesales.space ACME_EMAIL=<seu-email> \
     SUPER_ADMIN_EMAIL=<email-do-admin> bash setup-vps.sh
```

O script pausa pedindo uma **deploy key** do GitHub: ele mostra a chave pública; cadastre em
Repositório > Settings > Deploy keys (**sem** permissão de escrita) e aperte ENTER.
(Se rodar sem terminal interativo, ele para nesse ponto; cadastre a chave e rode de novo.)

### O que o script instala
Swap de 2G, ufw + regras de iptables (80/443), fail2ban, atualizações automáticas, SSH só por chave (se já houver chave autorizada), Node 22, PostgreSQL, Caddy, serviço `barberlab`, backup diário e o comando `barberlab-deploy`.

### Variáveis do `.env`
| Variável | Para quê |
| --- | --- |
| `NODE_ENV=production` | modo produção |
| `DATABASE_URL` | Postgres local (senha gerada) |
| `NEXTAUTH_URL` | `https://<domínio>` (o app acusa erro se for localhost) |
| `NEXTAUTH_SECRET` | assina a sessão **e cifra as credenciais do WhatsApp no banco**. Não troque depois |
| `SUPER_ADMIN_EMAIL/NAME/PASSWORD` | conta de super admin, criada na subida do app. Troque a senha no 1º login |

`DEMO_MODE` deve ficar desligado em produção real (todo login vira admin da barbearia demo).
Depois de editar o `.env`: `sudo systemctl restart barberlab`.

## Operação

| Tarefa | Comando |
| --- | --- |
| Logs do app | `journalctl -u barberlab -f` |
| Logs do HTTPS | `sudo journalctl -u caddy -n 50` |
| Status | `systemctl status barberlab caddy postgresql` |
| Reiniciar | `sudo systemctl restart barberlab` |
| Backup manual | `sudo barberlab-backup` |
| Restaurar backup | `gunzip -c /var/backups/barberlab/<arquivo>.sql.gz \| sudo -u postgres psql barberlab` |

Backup automático: todo dia às 03:15, guardado 14 dias em `/var/backups/barberlab`, **na própria VPS**. Copie para fora (rclone/scp) e guarde uma cópia do `/opt/barberlab/.env`.

## Problemas conhecidos

- **522 da Cloudflare / certificado não emite**: porta 80/443 fechada. Teste de fora com `nc -zv <IP> 443`. Costuma ser a regra de entrada do provedor (ver "Antes", item 2).
- **Let's Encrypt `rateLimited`**: muitas validações falhas seguidas; espere o horário informado no log do Caddy e rode `sudo systemctl restart caddy`.
- **`husky: not found` / build sem typescript no `npm ci`**: o `NODE_ENV=production` faz o npm pular devDependencies; o deploy já usa `--include=dev`.
- **`JWT_SESSION_ERROR: decryption operation failed` no log / erro ao logar**: o navegador tem cookie de sessão antigo (outro segredo). Apague os cookies do site ou use janela anônima.
- **Trocar o `NEXTAUTH_SECRET`**: derruba todas as sessões e invalida as credenciais do WhatsApp salvas; só faça sabendo disso.
