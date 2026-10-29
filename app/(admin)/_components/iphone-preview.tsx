"use client"

import {
  THEME_PREVIEW_MESSAGE,
  type ThemePreviewMessage,
} from "@/app/_lib/theme-preview"
import { useCallback, useEffect, useRef } from "react"

interface IphonePreviewProps {
  // Rascunho atual; null mostra o visual padrão.
  theme: unknown
  logoUrl: string
}

const SCREEN_WIDTH = 320
const VIEWPORT_WIDTH = 390
const VIEWPORT_HEIGHT = 780
const SCALE = SCREEN_WIDTH / VIEWPORT_WIDTH

// Mostra a página pública de verdade dentro de um iPhone, em largura de 390px.
const IphonePreview = ({ theme, logoUrl }: IphonePreviewProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const loadedRef = useRef(false)

  const send = useCallback(() => {
    if (!loadedRef.current) return
    const message: ThemePreviewMessage = {
      type: THEME_PREVIEW_MESSAGE,
      theme,
      logoUrl,
    }
    frameRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin,
    )
  }, [theme, logoUrl])

  useEffect(send, [send])

  return (
    <div className="mx-auto w-fit rounded-[52px] border-[3px] border-zinc-600 bg-zinc-900 p-2.5 shadow-2xl">
      <div
        className="relative overflow-hidden rounded-[42px] bg-black"
        style={{
          width: SCREEN_WIDTH,
          height: VIEWPORT_HEIGHT * SCALE,
        }}
      >
        <iframe
          ref={frameRef}
          src="/tema-preview"
          title="Prévia da página no celular"
          onLoad={() => {
            loadedRef.current = true
            send()
          }}
          className="origin-top-left border-0"
          style={{
            width: VIEWPORT_WIDTH,
            height: VIEWPORT_HEIGHT,
            transform: `scale(${SCALE})`,
          }}
        />
        {/* Dynamic Island */}
        <div className="pointer-events-none absolute top-2.5 left-1/2 h-6 w-20 -translate-x-1/2 rounded-full bg-black" />
        {/* Home indicator */}
        <div className="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/70 mix-blend-difference" />
      </div>
    </div>
  )
}

export default IphonePreview
