// Protocolo entre o painel (pai) e a página dentro do iframe de prévia.
export const THEME_PREVIEW_MESSAGE = "barberlab:theme-preview"

export interface ThemePreviewMessage {
  type: typeof THEME_PREVIEW_MESSAGE
  theme: unknown
  logoUrl: string
}
