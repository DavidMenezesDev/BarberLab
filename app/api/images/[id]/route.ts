import { db } from "@/app/_lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const image = await db.image.findUnique({
    where: { id },
    select: { data: true, contentType: true },
  })

  if (!image) return new Response("Não encontrada.", { status: 404 })

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      // O id nunca é reaproveitado: trocar a foto gera outro id.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  })
}
