"use client"

import BarbershopDetail from "@/app/(customer)/_components/barbershop-detail"
import {
  barbershopThemeSchema,
  themeToCssVars,
  type BarbershopTheme,
} from "@/app/_lib/theme"
import { fontFamilyFor } from "@/app/_lib/theme-fonts"
import {
  THEME_PREVIEW_MESSAGE,
  type ThemePreviewMessage,
} from "@/app/_lib/theme-preview"
import { useEffect, useState, type ComponentProps } from "react"

type DetailProps = ComponentProps<typeof BarbershopDetail>

interface PreviewHostProps {
  barbershop: DetailProps["barbershop"]
  openingHours: DetailProps["openingHours"]
}

// Renderiza a página real e aplica o rascunho recebido do painel, sem salvar.
const PreviewHost = ({ barbershop, openingHours }: PreviewHostProps) => {
  const [theme, setTheme] = useState<BarbershopTheme | null>(null)
  const [logoUrl, setLogoUrl] = useState(barbershop.logoUrl)

  useEffect(() => {
    const onMessage = (event: MessageEvent<ThemePreviewMessage>) => {
      if (event.origin !== window.location.origin) return
      if (event.source !== window.parent) return
      if (event.data?.type !== THEME_PREVIEW_MESSAGE) return

      const parsed = barbershopThemeSchema.safeParse(event.data.theme)
      setTheme(parsed.success ? parsed.data : null)
      setLogoUrl(event.data.logoUrl || null)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  useEffect(() => {
    if (!theme) return

    const vars = themeToCssVars(theme, {
      heading: fontFamilyFor(theme.headingFont),
      body: fontFamilyFor(theme.bodyFont),
    })
    const root = document.documentElement
    Object.entries(vars).forEach(([name, value]) =>
      root.style.setProperty(name, value),
    )

    return () => {
      Object.keys(vars).forEach((name) => root.style.removeProperty(name))
    }
  }, [theme])

  return (
    <BarbershopDetail
      barbershop={{ ...barbershop, logoUrl }}
      openingHours={openingHours}
      showHeroNav={false}
    />
  )
}

export default PreviewHost
