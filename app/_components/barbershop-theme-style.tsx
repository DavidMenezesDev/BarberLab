import { fontFamilyFor } from "@/app/_lib/theme-fonts"
import { parseStoredTheme, themeToCssVars } from "@/app/_lib/theme"

interface BarbershopThemeStyleProps {
  theme: unknown
}

// Sobrescreve os tokens no <html> (e não num wrapper) para que dialogs e
// sheets, que renderizam fora da página, herdem as mesmas cores e fontes.
// Só entram aqui cores #RRGGBB e chaves de fonte validadas por parseStoredTheme.
const BarbershopThemeStyle = ({ theme }: BarbershopThemeStyleProps) => {
  const parsed = parseStoredTheme(theme)
  if (!parsed) return null

  const vars = themeToCssVars(parsed, {
    heading: fontFamilyFor(parsed.headingFont),
    body: fontFamilyFor(parsed.bodyFont),
  })

  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";")

  return <style>{`:root.dark{${declarations}}`}</style>
}

export default BarbershopThemeStyle
