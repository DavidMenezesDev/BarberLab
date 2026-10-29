"use server"

import {
  ACTIVE_BARBERSHOP_COOKIE,
  getAdminUnits,
  requireBarbershopAdmin,
  requireBarbershopOwner,
} from "@/app/_lib/auth"
import { isDemo, isSingleTenant } from "@/app/_lib/deployment"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { uniqueBarbershopSlug } from "@/app/_lib/slug"
import { StaffRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { MAX_UNITS_PER_USER, newUnitSchema } from "../_lib/unit-schema"
import { PLACEHOLDER_BARBERSHOP_IMAGE } from "../_lib/signup-schema"

const UM_ANO = 365 * 24 * 60 * 60

const selectUnit = async (barbershopId: string) => {
  ;(await cookies()).set(ACTIVE_BARBERSHOP_COOKIE, barbershopId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UM_ANO,
  })
  revalidatePath("/", "layout")
}

const createGroupFor = async (
  barbershopId: string,
  current: { name: string; city: string | null; slug: string },
) => {
  const unitSlug = await uniqueBarbershopSlug(
    `${current.name} ${current.city ?? "unidade 1"}`,
  )

  const [group] = await db.$transaction([
    db.barbershopGroup.create({
      data: {
        name: current.name,
        slug: current.slug,
        barbershops: { connect: { id: barbershopId } },
      },
      select: { id: true },
    }),
    db.barbershop.update({
      where: { id: barbershopId },
      data: { slug: unitSlug },
    }),
  ])

  return group.id
}

export const switchBarbershop = async (barbershopId: string) => {
  const admin = await requireBarbershopAdmin()
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  if (!admin.units.some((unit) => unit.id === barbershopId)) {
    return { ok: false as const, error: "Unidade não encontrada." }
  }

  await selectUnit(barbershopId)

  return { ok: true as const }
}

export const createUnit = async (input: unknown) => {
  const admin = await requireBarbershopOwner()
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  if (isDemo || isSingleTenant) {
    return {
      ok: false as const,
      error: "Esta instalação não permite criar novas unidades.",
    }
  }

  const limit = await consumeRateLimit("adminWrite", admin.userId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsed = newUnitSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const units = await getAdminUnits(admin.userId)
  if (units.length >= MAX_UNITS_PER_USER) {
    return {
      ok: false as const,
      error: `O limite é de ${MAX_UNITS_PER_USER} unidades por conta.`,
    }
  }

  const { phone, imageUrl, ...rest } = parsed.data
  const slug = await uniqueBarbershopSlug(rest.name)

  const current = await db.barbershop.findUnique({
    where: { id: admin.barbershopId },
    select: { name: true, city: true, slug: true, groupId: true },
  })
  if (!current) return { ok: false as const, error: "Unidade não encontrada." }

  // A primeira unidade cede o endereço atual à marca: quem já divulgou o
  // link passa a escolher a unidade antes de agendar.
  const groupId =
    current.groupId ?? (await createGroupFor(admin.barbershopId, current))

  const barbershop = await db.barbershop.create({
    data: {
      ...rest,
      slug,
      groupId,
      imageUrl: imageUrl || PLACEHOLDER_BARBERSHOP_IMAGE,
      phones: [phone.trim()],
      members: {
        create: { userId: admin.userId, staffRole: StaffRole.OWNER },
      },
    },
    select: { id: true },
  })

  // Quem cria a unidade passa a trabalhar nela.
  await selectUnit(barbershop.id)
  revalidatePath("/barbershops")
  revalidatePath("/")
  revalidatePath("/[slug]", "page")

  return { ok: true as const }
}
