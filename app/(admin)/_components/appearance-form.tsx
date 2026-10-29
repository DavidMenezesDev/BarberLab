"use client"

import ImageUploadField from "@/app/_components/image-upload-field"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"
import { Select } from "@/app/_components/ui/select"
import {
  DEFAULT_THEME,
  THEME_FONTS,
  THEME_PRESETS,
  barbershopThemeBaseSchema,
  themeContrastIssue,
  type BarbershopTheme,
  type ThemeFontKey,
} from "@/app/_lib/theme"
import { RotateCcwIcon, SaveIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { saveBarbershopAppearance } from "../_actions/appearance"
import IphonePreview from "./iphone-preview"

interface AppearanceFormProps {
  logoUrl: string
  theme: BarbershopTheme | null
}

const COLOR_FIELDS = [
  { key: "primary", label: "Destaque", hint: "Botões e ícones" },
  { key: "background", label: "Fundo", hint: "Fundo da página" },
  { key: "surface", label: "Cartões", hint: "Blocos de conteúdo" },
  { key: "text", label: "Texto", hint: "Títulos e textos" },
] as const

const FONT_FIELDS = [
  { key: "headingFont", label: "Fonte dos títulos" },
  { key: "bodyFont", label: "Fonte do texto" },
] as const

const isCompleteHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value)

const AppearanceForm = ({ logoUrl, theme }: AppearanceFormProps) => {
  const [draft, setDraft] = useState<BarbershopTheme>(theme ?? DEFAULT_THEME)
  const [logo, setLogo] = useState(logoUrl)
  const [customized, setCustomized] = useState(theme !== null)
  const [isSaving, setIsSaving] = useState(false)

  const update = (patch: Partial<BarbershopTheme>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setCustomized(true)
  }

  const valid = barbershopThemeBaseSchema.safeParse(draft).success
  const issue = valid ? themeContrastIssue(draft) : null

  const save = async (nextTheme: BarbershopTheme | null) => {
    setIsSaving(true)
    const result = await saveBarbershopAppearance({
      theme: nextTheme,
      logoUrl: logo,
    })
    setIsSaving(false)

    if (result.ok) {
      toast.success("Aparência salva.")
    } else {
      toast.error(result.error)
    }
  }

  const restoreDefault = async () => {
    setDraft(DEFAULT_THEME)
    setCustomized(false)
    await save(null)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
      <Card>
        <CardContent className="space-y-6 p-4 lg:p-6">
          <div className="space-y-2">
            <Label>Modelos prontos</Label>
            <div className="flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDraft(preset.theme)
                    setCustomized(true)
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: preset.theme.primary }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COLOR_FIELDS.map(({ key, label, hint }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`color-${key}`}>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={isCompleteHex(draft[key]) ? draft[key] : "#000000"}
                    onChange={(event) => update({ [key]: event.target.value })}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
                  />
                  <Input
                    aria-label={`${label} (código da cor)`}
                    value={draft[key]}
                    maxLength={7}
                    spellCheck={false}
                    onChange={(event) => update({ [key]: event.target.value })}
                    className="font-mono uppercase"
                  />
                </div>
                <p className="text-muted-foreground text-xs">{hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FONT_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Select
                  id={key}
                  value={draft[key]}
                  onChange={(event) =>
                    update({ [key]: event.target.value as ThemeFontKey })
                  }
                >
                  {THEME_FONTS.map((font) => (
                    <option key={font.key} value={font.key}>
                      {font.label} · {font.kind}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>

          {!valid && (
            <p role="alert" className="text-destructive text-sm">
              Confira os códigos das cores: use o formato #RRGGBB.
            </p>
          )}
          {issue && (
            <p role="alert" className="text-destructive text-sm">
              {issue}
            </p>
          )}

          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUploadField
              value={logo}
              onChange={setLogo}
              previewClassName="h-28 max-w-xs"
            />
            <p className="text-muted-foreground text-xs">
              Aparece sobre a foto de capa. A foto de capa é trocada em
              Configurações, em Dados da barbearia.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isSaving || !valid || Boolean(issue)}
              onClick={() => save(draft)}
              className="w-full sm:w-auto"
            >
              <SaveIcon />
              {isSaving ? "Salvando..." : "Salvar aparência"}
            </Button>
            {customized && (
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={restoreDefault}
                className="w-full sm:w-auto"
              >
                <RotateCcwIcon />
                Voltar ao padrão
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="lg:sticky lg:top-6">
        <p className="text-muted-foreground mb-3 text-center text-xs font-medium tracking-wide uppercase">
          Prévia no celular
        </p>
        <IphonePreview theme={valid && !issue ? draft : null} logoUrl={logo} />
      </div>
    </div>
  )
}

export default AppearanceForm
