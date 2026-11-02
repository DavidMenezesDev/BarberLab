import { db } from "./prisma"
import { SLUG_FORMAT_MESSAGE, SLUG_PATTERN, slugify } from "./slug-format"

export { slugify }

// Primeiro segmento de URL que já pertence ao sistema: uma barbearia com
// esse nome não pode ocupar o endereço.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "apple-icon",
  "barber",
  "barbers",
  "barbershops",
  "bookings",
  "cadastro",
  "carreiras",
  "contato",
  "convite",
  "cookies",
  "dashboard",
  "entrar",
  "favicon",
  "icon",
  "aparencia",
  "tema-preview",
  "login",
  "manifest",
  "master",
  "overview",
  "parceiros",
  "perfil",
  "privacidade",
  "robots",
  "schedule",
  "services",
  "settings",
  "sitemap",
  "sobre",
  "termos",
  "www",
])

// O endereço é compartilhado com as marcas de várias unidades.
export const isSlugAvailable = async (slug: string, excludeId?: string) => {
  const [taken, takenByGroup] = await Promise.all([
    db.barbershop.findUnique({ where: { slug }, select: { id: true } }),
    db.barbershopGroup.findUnique({ where: { slug }, select: { id: true } }),
  ])

  return !takenByGroup && (!taken || taken.id === excludeId)
}

// Formato, nomes reservados e unicidade. Devolve o motivo quando não serve.
export const checkSlug = async (
  slug: string,
  excludeId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  if (!SLUG_PATTERN.test(slug)) {
    return { ok: false, error: SLUG_FORMAT_MESSAGE }
  }
  if (RESERVED_SLUGS.has(slug) || !(await isSlugAvailable(slug, excludeId))) {
    return { ok: false, error: "Este endereço já está em uso. Escolha outro." }
  }

  return { ok: true }
}

// `excludeId` deixa a própria barbearia manter o endereço ao salvar.
export const uniqueBarbershopSlug = async (
  name: string,
  excludeId?: string,
) => {
  let base = slugify(name) || "barbearia"
  if (RESERVED_SLUGS.has(base)) base = `${base}-barbearia`

  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    if (await isSlugAvailable(slug, excludeId)) return slug
  }

  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}
