import { auth } from "@/app/_lib/auth"
import {
  IMAGE_PATH_PREFIX,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  sniffImageType,
} from "@/app/_lib/images"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, getClientIp } from "@/app/_lib/rate-limit"
import { NextResponse } from "next/server"

const fail = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status })

export async function POST(request: Request) {
  // O cadastro da barbearia envia foto antes de existir conta: vale por IP.
  const session = await auth()
  const key = session?.user?.id
    ? `user:${session.user.id}`
    : `ip:${await getClientIp()}`

  const limit = await consumeRateLimit("upload", key)
  if (!limit.allowed) {
    return fail("Muitos envios. Tente de novo em alguns minutos.", 429)
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_IMAGE_BYTES + 64 * 1024) {
    return fail("A imagem passa de 4 MB.", 413)
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get("file")
  } catch {
    return fail("Envio inválido.", 400)
  }

  if (!(file instanceof File) || file.size === 0) {
    return fail("Escolha uma imagem.", 400)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return fail("A imagem passa de 4 MB.", 413)
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const contentType = sniffImageType(bytes)
  if (!contentType) {
    const accepted = Object.values(IMAGE_TYPES).join(", ")
    return fail(`Formato não aceito. Use ${accepted}.`, 415)
  }

  const image = await db.image.create({
    data: { data: bytes, contentType, size: bytes.byteLength },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, url: `${IMAGE_PATH_PREFIX}${image.id}` })
}
