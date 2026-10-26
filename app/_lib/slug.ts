import { db } from "./prisma"

export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)

export const uniqueBarbershopSlug = async (name: string) => {
  const base = slugify(name) || "barbearia"

  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    const taken = await db.barbershop.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!taken) return slug
  }

  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}
