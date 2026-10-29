import { z } from "zod"

export const IMAGE_PATH_PREFIX = "/api/images/"
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export const IMAGE_TYPES = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/gif": "GIF",
} as const

export type ImageType = keyof typeof IMAGE_TYPES

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte)

// Confia nos bytes do arquivo, não no tipo que o navegador declarou.
export const sniffImageType = (bytes: Uint8Array): ImageType | null => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png"
  }
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif"
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp"
  }
  return null
}

// Aceita link externo (https) ou imagem enviada para o próprio sistema.
const isImageReference = (value: string) =>
  (value.startsWith(IMAGE_PATH_PREFIX) &&
    /^[\w-]+$/.test(value.slice(IMAGE_PATH_PREFIX.length))) ||
  z.url({ protocol: /^https?$/ }).safeParse(value).success

const INVALID_IMAGE = "Envie uma imagem ou informe uma URL válida."

export const imageUrlSchema = z
  .string()
  .trim()
  .refine(isImageReference, { message: INVALID_IMAGE })

export const optionalImageUrlSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isImageReference(value), {
    message: INVALID_IMAGE,
  })
