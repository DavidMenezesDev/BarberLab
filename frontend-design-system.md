# Design System: Superlist + Blaze Orange

Extraído do HTML/CSS de superlist.com (tokens do Framer), com a escala Blaze Orange como complemento. Os valores marcados como **adaptação** não vêm do site original e foram criados para o tema claro da home de exemplo.

---

## 1. Princípios

- **Dark-first.** Fundo azul-noite quase preto, texto branco, acentos vibrantes.
- **Lúdico, mas limpo.** Rabiscos desenhados à mão (checks, raios) sobre tipografia geométrica e muito espaço em branco.
- **Cor como ritmo.** O ciclo coral → roxo → rosa é a assinatura da marca.
- **Tracking negativo nos títulos**, cantos bem arredondados, sombras discretas.
- **Movimento com propósito.** Spring suave na entrada e traços que se desenham.

---

## 2. Cores

### 2.1 Fundos e superfícies (tema escuro)

| Token | HEX | Uso |
|---|---|---|
| `--bg` | `#181824` | Fundo principal da página |
| `--bg-alt` | `#181825` | Seções alternadas, hero |
| `--surface` | `#191C2B` | Cards, depoimentos |
| `--surface-2` | `#26253B` | Rodapé, card de update |
| `--border` | `#363955` | Bordas de cards |
| Borda sutil | `rgba(255,255,255,.06–.09)` | Contornos de cards e molduras |
| Preenchimento translúcido | `rgba(255,255,255,.05)` | Molduras de mockup |

### 2.2 Texto (tema escuro)

| Token | HEX | Uso |
|---|---|---|
| `--text` | `#FFFFFF` | Texto principal |
| `--text-nav` | `#F7F7FF` | Links de navegação |
| `--text-muted` | `#8E8DA0` | Texto secundário, links do rodapé |
| `--text-dim` | `#696F81` | Texto apagado em seções |
| Citação | `#535676` | Pull-quote |

### 2.3 Acentos de marca

| Nome | HEX | Onde aparece |
|---|---|---|
| Coral (principal) | `#F84F39` | Destaque do H1, checks, ciclo do logotipo |
| Vermelho vivo | `#FF3A27` | Botão primário |
| Vermelho hero | `#FF4A36` | Destaque do H1 na home |
| Roxo | `#6B66DA` | Ciclo do logotipo, linhas |
| Roxo progresso | `#7577E0` | Barra de progresso |
| Lilás | `#8F89FA` | Raio (flash), linhas |
| Rosa | `#F866DB` | Ciclo do logotipo, linhas |
| Magenta | `#F739F7` | Título "App" no rodapé |
| Azul | `#2590F1` | Offline, "Social" no rodapé |
| Verde | `#33B887` / `#22C55E` | Widgets, lembretes, "Updates" |
| Amarelo | `#FBE74E` | "Use Cases" no rodapé |
| Ciano | `#4AE5EF` | Disponível no sistema |

**Ciclo do logotipo:** coral → roxo → rosa, repetido letra por letra. Uso exclusivo do nome da marca.

### 2.4 Escala semântica (estados)

| Estado | 50 | 200 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|
| Sucesso | `#F0FDF4` | `#BBF7D0` | `#22C55E` | `#16A34A` | `#16803D` | `#14532D` | — |
| Atenção | `#FFFBEB` | `#FDE68A` | `#F59E0B` | `#D97708` | `#B45308` | `#78350F` | — |
| Erro | `#FEF2F2` | `#FECACA` | `#EF4444` | `#DC2626` | `#B91C1C` | `#7F1C1D` | — |

### 2.5 Blaze Orange (complemento)

| Token | HEX | Uso sugerido |
|---|---|---|
| `blaze-orange-50` | `#FFF7EC` | Fundo de alertas no tema claro |
| `blaze-orange-100` | `#FFEED3` | Fundo de badges (claro) |
| `blaze-orange-200` | `#FFD9A5` | Bordas de destaque (claro) |
| `blaze-orange-300` | `#FFBD6D` | Texto de badge e ícones (escuro) |
| `blaze-orange-400` | `#FF9632` | Hover de acento, gradientes |
| `blaze-orange-500` | `#FF770A` | Cor base do acento |
| `blaze-orange-600` | `#FF6202` | Destaque ativo, fim do gradiente do CTA |
| `blaze-orange-700` | `#CC4402` | Fundo com texto branco (passa AA) |
| `blaze-orange-800` | `#A1360B` | Texto de badge (claro), estado pressionado |
| `blaze-orange-900` | `#822E0C` | Texto sobre fundos claros |
| `blaze-orange-950` | `#461504` | Fundo de badge (escuro) |

**Regras de uso**
- É um acento **secundário**: prioridade média, prazos próximos, streaks, badges, hover do CTA.
- **Não entra** no ciclo coral → roxo → rosa do logotipo.
- Coral e vermelho continuam sendo a cor de marca.

**Contraste**

| Combinação | Razão | Resultado |
|---|---|---|
| `#FF770A` sobre `#181824` | ~6.7:1 | Passa AA |
| Branco sobre `#FF770A` | ~2.7:1 | Falha |
| Branco sobre `#FF6202` | ~3.0:1 | Só texto grande |
| Branco sobre `#CC4402` | ~4.8:1 | Passa AA |

### 2.6 Tema claro (adaptação)

Não existe no site original. Foi criado para a home de exemplo.

| Token | HEX |
|---|---|
| `--bg` | `#F7F7FF` |
| `--bg-alt` | `#EFEFFB` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#E7E7F6` |
| `--border` | `#D9D9EE` |
| `--text` | `#26253B` |
| `--text-muted` | `#5E5E68` |
| `--text-dim` | `#8E8DA0` |
| `--red` (botão) | `#E8321F` |
| Badge laranja | fundo `blaze-100`, texto `blaze-800` |

---

## 3. Tipografia

| Função | Fonte original | Alternativa gratuita | Peso |
|---|---|---|---|
| Títulos e UI (nav, botões, H1–H6) | Haffer XH (licenciada) | Inter Tight | 600 (700 para ênfase) |
| Texto corrido | Inter | Inter | 400 / 500 |
| Citações em destaque | Jersey 10 (Google Fonts) | Jersey 10 | 400 |
| Nomes em depoimentos | Satoshi (Fontshare) | Inter | 500 |
| Apoio mono | Fragment Mono | — | 400 |

### Escala

| Estilo | Desktop | Tablet | Mobile | Tracking | Line-height |
|---|---|---|---|---|---|
| H1 hero | 64px | 64px | 48px | -0.02em | 0.95 |
| H1 secundário | 51px | 56px | 28px | -0.02em | 1.2 |
| H2 | 48px | 46px | 36px | -0.02em | 1.1 |
| H2 CTA final | 48px | 40px | 32px | -0.02em | 1.2 |
| H3 destaque | 30px | 26px | 24px | -0.02em | 1.2 |
| H3 card | 24px | 20px | 18px | -0.02em | 1.2 |
| H4 | 22px | 22px | 20px | -0.015em | 1.5 |
| Parágrafo grande (Inter 500) | 18px | 17px | 14px | -0.02em | 1.4 |
| Parágrafo médio (Inter 400) | 18px | 18px | 16px | -0.012em | 1.2 |
| Nav / botão | 16px | 16px | 16px | -0.01em | 1.2 |
| Rodapé | 14px | 14px | 14px | -0.005em | 1.3 |
| Legenda | 12px | 12px | 12px | 0 | 1.2 |
| Citação (Jersey 10) | 51px | 64px | 42px | -0.02em | 0.9 |

Regras: tracking levemente negativo nos títulos; `text-wrap: balance` em textos centralizados; linhas de texto abaixo de 80 caracteres.

---

## 4. Layout e espaçamento

**Breakpoints**

| Nome | Faixa |
|---|---|
| Mobile | até 809px |
| Tablet | 810px a 1199px |
| Desktop | 1200px ou mais (hero em 1300px) |

**Larguras e paddings**

| Item | Valor |
|---|---|
| Largura máx. das seções | 1500px |
| Largura máx. do rodapé | 1400px |
| Largura máx. de blocos de texto | 800px |
| Padding lateral | 50px desktop, 30px tablet, 20px mobile |
| Padding vertical de seção | 64px a 200px |
| Gap entre colunas de cards | 80px a 100px |

---

## 5. Formas

| Elemento | Raio |
|---|---|
| Botão primário, badges | `100px` (pílula) |
| Cards, imagens de mockup | `20px` |
| Moldura de mockup | `38px` |
| Botão da barra de cookies | `100px` |
| Itens de menu, links | `8px` |

---

## 6. Componentes

### Botão primário
- Pílula, padding `14px 25px`, texto branco, Haffer SemiBold 18px, tracking `-0.01em`.
- Fundo `#FF3A27` (escuro) ou `#E8321F` (claro, adaptação).
- Sombra: `0 1px 1px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.05), inset 0 .5px 0 rgba(255,255,255,.45)`.
- Hover: gradiente `135deg` de vermelho para `blaze-orange-600`.
- Variantes: pequeno (padding `10px 18px`, 16px) e largo (165px, padding `14px 25px`).

### Card
- Fundo `--surface`, borda `1px rgba(255,255,255,.06)`, raio `20px`.
- Sombra `0 10px 15px rgba(0,0,0,.08)`.
- Depoimento: padding `40px`, texto 16px, nome em Satoshi 500, fonte de origem com 80% de opacidade.

### Moldura de mockup
- Borda de `16px` em `rgba(255,255,255,.09)`, raio externo `38px`, interno `20px`.
- Highlight superior: `0 -1px 1px rgba(255,255,255,.25)`.

### Navegação
- Transparente com `backdrop-filter: blur(29px)`.
- Links Haffer 16px; sublinhado de `1.5px` animado no hover.
- Menus com chevron.
- Altura de 72px.

### Badge
- Pílula, 12px SemiBold, padding `4px 10px`.
- Escuro: fundo `blaze-950`, texto `blaze-300`, borda `blaze-500` a 30%.
- Claro: fundo `blaze-100`, texto `blaze-800`.

### Checkbox de tarefa
- Caixa `24px`, raio `8px`, borda `2px`.
- Marcado: borda coral e check desenhado com traço coral de `4px`.
- Texto riscado com a linha em coral.

### Links do rodapé
- Cor `#8E8DA0`, hover branco, transição `color .2s cubic-bezier(.44,0,.56,1)`.
- Títulos de coluna em cores de acento (coral, magenta, amarelo, azul, verde).

---

## 7. Ilustração e movimento

**Rabiscos (SVG)**
- Traço de `4px`, `stroke-linecap: round`, sem preenchimento.
- Animados com `stroke-dasharray` / `stroke-dashoffset` (`pathLength="1"`).
- Cores: check coral `#F84F39`, raio lilás `#8F89FA`, linhas lilás/rosa/coral.

**Entrada com spring**
| Elemento | Deslocamento Y | Duração | Bounce |
|---|---|---|---|
| Título | -50px | 0.4s | 0 |
| Subtítulo | -20px | 0.6s | 0.2 |
| Botões | -18px | 0.5s | 0 |
| Mockup | +50px | 1s | 0 |

**Outros**
- Fundo com glow roxo-azulado em ~0.9 de opacidade.
- Logos de clientes em branco monocromático, 50% a 80% de opacidade.
- Carrossel vertical infinito de depoimentos com fade de `#181824` para transparente nas pontas.
- Respeitar `prefers-reduced-motion`.

---

## 8. Tom de voz

Direto, caloroso, levemente irreverente. Frases curtas, verbos de ação, sentence case.

- "Tasks, notes, and plans. Finally in one app."
- "Stop juggling five different apps."
- "Fast AF"

CTA diz exatamente o que acontece: "Sign up for free", "Download for macOS".

---

## 9. Tokens em CSS

```css
:root {
  /* Superfícies (escuro) */
  --bg: #181824;
  --bg-alt: #181825;
  --surface: #191C2B;
  --surface-2: #26253B;
  --border: #363955;

  /* Texto */
  --text: #FFFFFF;
  --text-nav: #F7F7FF;
  --text-muted: #8E8DA0;
  --text-dim: #696F81;

  /* Acentos de marca */
  --coral: #F84F39;
  --red: #FF3A27;
  --purple: #6B66DA;
  --lilac: #8F89FA;
  --pink: #F866DB;
  --magenta: #F739F7;
  --blue: #2590F1;
  --green: #33B887;
  --yellow: #FBE74E;

  /* Blaze Orange */
  --color-blaze-orange-50:  #fff7ec;
  --color-blaze-orange-100: #ffeed3;
  --color-blaze-orange-200: #ffd9a5;
  --color-blaze-orange-300: #ffbd6d;
  --color-blaze-orange-400: #ff9632;
  --color-blaze-orange-500: #ff770a;
  --color-blaze-orange-600: #ff6202;
  --color-blaze-orange-700: #cc4402;
  --color-blaze-orange-800: #a1360b;
  --color-blaze-orange-900: #822e0c;
  --color-blaze-orange-950: #461504;

  /* Aliases semânticos do acento quente */
  --accent-warm:        var(--color-blaze-orange-500);
  --accent-warm-hover:  var(--color-blaze-orange-400);
  --accent-warm-press:  var(--color-blaze-orange-700);
  --accent-warm-subtle: var(--color-blaze-orange-950);

  /* Tipografia */
  --font-display: "Haffer XH SemiBold", "Inter Tight", Arial, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-quote: "Jersey 10", sans-serif;
  --font-accent: "Satoshi", "Inter", sans-serif;

  /* Forma */
  --radius-pill: 100px;
  --radius-card: 20px;
  --radius-frame: 38px;

  /* Sombras */
  --shadow-btn: 0 1px 1px rgba(0,0,0,.1), 0 2px 4px rgba(0,0,0,.05),
                inset 0 .5px 0 rgba(255,255,255,.45);
  --shadow-card: 0 10px 15px rgba(0,0,0,.08);
  --shadow-frame: 0 -1px 1px rgba(255,255,255,.25);
}

body { background: var(--bg); color: var(--text); font-family: var(--font-body); }
h1 { font: 600 64px/.95 var(--font-display); letter-spacing: -.02em; }
h2 { font: 600 48px/1.1 var(--font-display); letter-spacing: -.02em; }

.btn {
  padding: 14px 25px; border-radius: var(--radius-pill);
  background: var(--red); color: #fff;
  font: 600 18px var(--font-display); letter-spacing: -.01em;
  box-shadow: var(--shadow-btn);
}
.btn:hover { background: linear-gradient(135deg, var(--red), var(--color-blaze-orange-600)); }

.card {
  background: var(--surface); border: 1px solid rgba(255,255,255,.06);
  border-radius: var(--radius-card); box-shadow: var(--shadow-card);
}

.badge-warm {
  background: var(--color-blaze-orange-950);
  color: var(--color-blaze-orange-300);
  border: 1px solid color-mix(in srgb, var(--color-blaze-orange-500) 30%, transparent);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
  font: 600 12px var(--font-display);
}
```

---

## 10. Tailwind

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#181824',
        surface: { DEFAULT: '#191C2B', 2: '#26253B' },
        line: '#363955',
        muted: '#8E8DA0',
        coral: '#F84F39',
        brand: {
          red: '#FF3A27', purple: '#6B66DA', lilac: '#8F89FA',
          pink: '#F866DB', magenta: '#F739F7', blue: '#2590F1',
          green: '#33B887', yellow: '#FBE74E',
        },
        'blaze-orange': {
          50: '#fff7ec', 100: '#ffeed3', 200: '#ffd9a5', 300: '#ffbd6d',
          400: '#ff9632', 500: '#ff770a', 600: '#ff6202', 700: '#cc4402',
          800: '#a1360b', 900: '#822e0c', 950: '#461504',
        },
      },
      fontFamily: {
        display: ['"Haffer XH SemiBold"', '"Inter Tight"', 'Arial', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        quote: ['"Jersey 10"', 'sans-serif'],
      },
      borderRadius: { pill: '100px', card: '20px', frame: '38px' },
      letterSpacing: { tightest: '-0.02em', tighter2: '-0.015em' },
    },
  },
}
```

---

## 11. Observações

- **Haffer XH** e **Satoshi** são fontes licenciadas. Sem licença, use Inter Tight (títulos) e Inter (corpo).
- O cinza `#8E8DA0` sobre `#181824` tem contraste razoável; confira AA em textos pequenos.
- Texto branco sobre laranja só passa AA a partir de `blaze-orange-700`.
- O HTML original não traz o SVG final do logotipo. O ícone do app está em `framerusercontent.com/images/X0Ni5UhSBoyE6b7Uf14uIMriLw.png`.
- A home de exemplo (Listinha) implementa este sistema e usa o tema do sistema para alternar entre escuro e claro.
