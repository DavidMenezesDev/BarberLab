import { db } from "@/app/_lib/prisma"
import { NextResponse } from "next/server"

// Consultado pelo Caddy (on_demand_tls.ask) antes de emitir um certificado:
// só o domínio principal e subdomínios de barbearias/marcas que existem.
// Sem isso, qualquer nome apontado para a VPS gastaria o limite do Let's Encrypt.
export const dynamic = "force-dynamic"

const ROOT_DOMAIN = process.env.ROOT_DOMAIN?.trim().toLowerCase() || null

const mainHost = () => {
  try {
    return new URL(process.env.NEXTAUTH_URL ?? "").hostname.toLowerCase()
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const domain = new URL(request.url).searchParams
    .get("domain")
    ?.trim()
    .toLowerCase()

  if (!domain) return new NextResponse(null, { status: 400 })
  if (domain === mainHost()) return new NextResponse(null, { status: 200 })
  if (!ROOT_DOMAIN || !domain.endsWith(`.${ROOT_DOMAIN}`)) {
    return new NextResponse(null, { status: 404 })
  }

  const slug = domain.slice(0, -(ROOT_DOMAIN.length + 1))
  if (!slug || slug.includes("."))
    return new NextResponse(null, { status: 404 })

  const [barbershop, group] = await Promise.all([
    db.barbershop.findUnique({ where: { slug }, select: { id: true } }),
    db.barbershopGroup.findUnique({ where: { slug }, select: { id: true } }),
  ])

  return new NextResponse(null, { status: barbershop || group ? 200 : 404 })
}
