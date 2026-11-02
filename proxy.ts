import { NextResponse, type NextRequest } from "next/server"
import { TENANT_HEADER } from "@/app/_lib/tenant"

const SINGLE_BARBERSHOP_ID = process.env.SINGLE_BARBERSHOP_ID?.trim() || null
// Domínio raiz dos subdomínios (ex.: "meudominio.com"). Vazio desliga o recurso.
const ROOT_DOMAIN = process.env.ROOT_DOMAIN?.trim().toLowerCase() || null
const NON_TENANT_SUBDOMAINS = new Set(["www", "app", "admin", "api", "barber"])

const tenantSlugFromHost = (request: NextRequest) => {
  if (!ROOT_DOMAIN) return null

  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase()
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null

  const slug = host.slice(0, -(ROOT_DOMAIN.length + 1))
  // Só um nível: "a.b.meudominio.com" não é uma barbearia.
  if (!slug || slug.includes(".") || NON_TENANT_SUBDOMAINS.has(slug)) {
    return null
  }

  return slug
}

const isCatalogPath = (pathname: string) =>
  pathname === "/barbershops" || pathname.startsWith("/barbershops/")

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (SINGLE_BARBERSHOP_ID) {
    if (isCatalogPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  // Sempre repassa o header: ou com o slug do subdomínio, ou sem nada, para
  // um valor forjado pelo cliente nunca chegar às páginas.
  const forwarded = new Headers(request.headers)
  forwarded.delete(TENANT_HEADER)

  const slug = tenantSlugFromHost(request)
  if (!slug) return NextResponse.next({ request: { headers: forwarded } })

  forwarded.set(TENANT_HEADER, slug)

  // A vitrine com todas as barbearias não existe dentro de um subdomínio.
  if (isCatalogPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // barbeariax.meudominio.com/ -> /barbeariax (o endereço no navegador não muda)
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = `/${slug}`
    // Atrás do proxy TLS (Caddy) o x-forwarded-proto faz a URL sair como https,
    // mas o Next escuta em http: com https o rewrite vira "externo" e quebra (500).
    if (process.env.NODE_ENV === "production") url.protocol = "http:"
    return NextResponse.rewrite(url, { request: { headers: forwarded } })
  }

  return NextResponse.next({ request: { headers: forwarded } })
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
}
