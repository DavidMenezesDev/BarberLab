"use client"

import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/app/_lib/images"
import { cn } from "@/app/_lib/utils"
import { Loader2Icon, UploadIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface ImageUploadFieldProps {
  value: string
  // eslint-disable-next-line no-unused-vars
  onChange: (url: string) => void
  disabled?: boolean
  className?: string
  previewClassName?: string
}

const ImageUploadField = ({
  value,
  onChange,
  disabled,
  className,
  previewClassName,
}: ImageUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const upload = async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("A imagem passa de 4 MB.")
      return
    }

    setIsUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)

      const response = await fetch("/api/upload", { method: "POST", body })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        toast.error(result?.error ?? "Não foi possível enviar a imagem.")
        return
      }

      onChange(result.url)
    } catch {
      toast.error("Não foi possível enviar a imagem.")
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const busy = disabled || isUploading

  return (
    <div className={cn("space-y-3", className)}>
      {value && (
        <div
          className={cn(
            "bg-muted relative h-40 w-full overflow-hidden rounded-lg border",
            previewClassName,
          )}
        >
          <Image
            src={value}
            alt="Prévia da imagem"
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(IMAGE_TYPES).join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <UploadIcon />
          )}
          {isUploading
            ? "Enviando..."
            : value
              ? "Trocar imagem"
              : "Enviar imagem"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onChange("")}
          >
            <XIcon />
            Remover
          </Button>
        )}
      </div>

      <Input
        placeholder="ou cole o endereço de uma imagem (https://...)"
        inputMode="url"
        value={value}
        disabled={busy}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-muted-foreground text-xs">
        JPG, PNG, WebP ou GIF, até 4 MB.
      </p>
    </div>
  )
}

export default ImageUploadField
