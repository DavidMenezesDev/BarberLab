import { db } from "./prisma"

// Primeiro segmento de URL que já pertence ao sistema: uma barbearia com
// esse nome não pode ocupar o endereço.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "apple-icon",
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
])

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)

// `excludeId` deixa a própria barbearia manter o endereço ao salvar.
export const uniqueBarbershopSlug = async (
  name: string,
  excludeId?: string,
) => {
  let base = slugify(name) || "barbearia"
  if (RESERVED_SLUGS.has(base)) base = `${base}-barbearia`

  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    // O endereço é compartilhado com as marcas de várias unidades.
    const [taken, takenByGroup] = await Promise.all([
      db.barbershop.findUnique({ where: { slug }, select: { id: true } }),
      db.barbershopGroup.findUnique({ where: { slug }, select: { id: true } }),
    ])
    if (!takenByGroup && (!taken || taken.id === excludeId)) return slug
  }

  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}
