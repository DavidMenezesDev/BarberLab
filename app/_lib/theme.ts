import { z } from "zod"

// Fontes disponíveis no seletor. A lista é fixa de propósito: o dono escolhe
// entre opções já carregadas (ver theme-fonts.ts), nunca digita um nome de fonte.
export const THEME_FONTS = [
  { key: "inter", label: "Inter", kind: "Moderna" },
  { key: "inter-tight", label: "Inter Tight", kind: "Moderna" },
  { key: "montserrat", label: "Montserrat", kind: "Moderna" },
  { key: "poppins", label: "Poppins", kind: "Moderna" },
  { key: "space-grotesk", label: "Space Grotesk", kind: "Moderna" },
  { key: "oswald", label: "Oswald", kind: "Condensada" },
  { key: "bebas-neue", label: "Bebas Neue", kind: "Condensada" },
  { key: "playfair-display", label: "Playfair Display", kind: "Clássica" },
  { key: "dm-serif-display", label: "DM Serif Display", kind: "Clássica" },
  { key: "lora", label: "Lora", kind: "Clássica" },
  { key: "roboto-slab", label: "Roboto Slab", kind: "Clássica" },
] as const

export type ThemeFontKey = (typeof THEME_FONTS)[number]["key"]

const FONT_KEYS = THEME_FONTS.map((font) => font.key) as [
  ThemeFontKey,
  ...ThemeFontKey[],
]

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB.")
  .transform((value) => value.toLowerCase())

export const barbershopThemeBaseSchema = z.object({
  primary: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
  headingFont: z.enum(FONT_KEYS),
  bodyFont: z.enum(FONT_KEYS),
})

export type BarbershopTheme = z.infer<typeof barbershopThemeBaseSchema>

type RGB = [number, number, number]

const toRgb = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]

const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrastRatio = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// Mistura `amount` (0 a 1) de `over` sobre `base`.
const mix = (base: string, over: string, amount: number) => {
  const [a, b] = [toRgb(base), toRgb(over)]
  return (
    "#" +
    a
      .map((channel, i) =>
        Math.round(channel + (b[i] - channel) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  )
}

// O CSS do projeto usa tokens HSL sem o `hsl()`: "H S% L%".
const toHslTriplet = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((channel) => channel / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }

  return `${Math.round(((h * 60 + 360) % 360) * 10) / 10} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

const readableOn = (hex: string) =>
  contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#000000")
    ? "#ffffff"
    : "#000000"

export const MIN_TEXT_CONTRAST = 4.5
export const MIN_PRIMARY_CONTRAST = 3

// Evita combinações que deixam a página ilegível para o cliente.
export const themeContrastIssue = (theme: BarbershopTheme) => {
  if (contrastRatio(theme.text, theme.background) < MIN_TEXT_CONTRAST) {
    return "O texto precisa de mais contraste com a cor de fundo."
  }
  if (contrastRatio(theme.text, theme.surface) < MIN_TEXT_CONTRAST) {
    return "O texto precisa de mais contraste com a cor dos cartões."
  }
  if (contrastRatio(theme.primary, theme.background) < MIN_PRIMARY_CONTRAST) {
    return "A cor de destaque precisa de mais contraste com o fundo."
  }
  return null
}

export const barbershopThemeSchema = barbershopThemeBaseSchema.superRefine(
  (theme, ctx) => {
    const issue = themeContrastIssue(theme)
    if (issue) ctx.addIssue({ code: "custom", message: issue })
  },
)

export const THEME_PRESETS: { name: string; theme: BarbershopTheme }[] = [
  {
    name: "Barber Lab",
    theme: {
      primary: "#f84f39",
      background: "#181824",
      surface: "#191c2b",
      text: "#ffffff",
      headingFont: "inter-tight",
      bodyFont: "inter",
    },
  },
  {
    name: "Clássica",
    theme: {
      primary: "#c9a24b",
      background: "#14110f",
      surface: "#1f1a16",
      text: "#f5efe6",
      headingFont: "playfair-display",
      bodyFont: "lora",
    },
  },
  {
    name: "Industrial",
    theme: {
      primary: "#f5b700",
      background: "#101010",
      surface: "#1b1b1b",
      text: "#f2f2f2",
      headingFont: "bebas-neue",
      bodyFont: "oswald",
    },
  },
  {
    name: "Clara",
    theme: {
      primary: "#1f6feb",
      background: "#f6f7f9",
      surface: "#ffffff",
      text: "#14171c",
      headingFont: "montserrat",
      bodyFont: "inter",
    },
  },
  {
    name: "Vintage",
    theme: {
      primary: "#a6402b",
      background: "#f3ead9",
      surface: "#fbf5e8",
      text: "#2b1d14",
      headingFont: "dm-serif-display",
      bodyFont: "roboto-slab",
    },
  },
]

export const DEFAULT_THEME = THEME_PRESETS[0].theme

// Lê o JSON salvo; se estiver fora do formato, a página volta ao visual padrão.
export const parseStoredTheme = (value: unknown): BarbershopTheme | null => {
  const parsed = barbershopThemeSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

// Tokens sobrescritos na página. `fontFamilies` vem de theme-fonts.ts porque
// o nome real da fonte é gerado pelo next/font.
export const themeToCssVars = (
  theme: BarbershopTheme,
  fontFamilies: { heading: string; body: string },
): Record<string, string> => {
  const muted = mix(theme.background, theme.text, 0.1)
  const border = mix(theme.background, theme.text, 0.18)
  const primaryForeground = readableOn(theme.primary)

  return {
    "--background": toHslTriplet(theme.background),
    "--foreground": toHslTriplet(theme.text),
    "--card": toHslTriplet(theme.surface),
    "--card-foreground": toHslTriplet(theme.text),
    "--popover": toHslTriplet(theme.surface),
    "--popover-foreground": toHslTriplet(theme.text),
    "--primary": toHslTriplet(theme.primary),
    "--primary-foreground": toHslTriplet(primaryForeground),
    "--secondary": toHslTriplet(muted),
    "--secondary-foreground": toHslTriplet(theme.text),
    "--muted": toHslTriplet(muted),
    "--muted-foreground": toHslTriplet(mix(theme.text, theme.background, 0.4)),
    "--accent": toHslTriplet(muted),
    "--accent-foreground": toHslTriplet(theme.text),
    "--border": toHslTriplet(border),
    "--input": toHslTriplet(border),
    "--ring": toHslTriplet(theme.primary),
    "--font-display": fontFamilies.heading,
    "--font-body": fontFamilies.body,
  }
}
