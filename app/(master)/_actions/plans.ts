"use server"

import { requireSuperAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { slugify } from "@/app/_lib/slug"
import { revalidatePath } from "next/cache"
import { planSchema } from "../_lib/plan-schema"

const revalidatePlans = () => {
  revalidatePath("/master", "layout")
}

const guard = async () => {
  const admin = await requireSuperAdmin()
  if (!admin) return { error: "Acesso negado." as const }

  const limit = await consumeRateLimit("adminWrite", admin.userId)
  if (!limit.allowed)
    return { error: rateLimitError(limit.retryAfterSeconds).error }

  return { admin }
}

const uniquePlanSlug = async (name: string) => {
  const base = slugify(name) || "plano"
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`
    if (!(await db.plan.findUnique({ where: { slug }, select: { id: true } })))
      return slug
  }
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

export const upsertPlan = async (input: unknown) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { id, isDefault, ...rest } = parsed.data

  if (isDefault && !rest.isActive) {
    return {
      ok: false as const,
      error: "O plano padrão precisa estar ativo.",
    }
  }

  const current = id
    ? await db.plan.findUnique({
        where: { id },
        select: { isDefault: true },
      })
    : null
  if (id && !current)
    return { ok: false as const, error: "Plano não encontrado." }

  if (current?.isDefault && !isDefault) {
    return {
      ok: false as const,
      error: "Defina outro plano como padrão antes de tirar este.",
    }
  }

  await db.$transaction(async (tx) => {
    // Só um plano é o padrão do cadastro.
    if (isDefault) {
      await tx.plan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    if (id) {
      await tx.plan.update({ where: { id }, data: { ...rest, isDefault } })
    } else {
      const count = await tx.plan.count()
      await tx.plan.create({
        data: {
          ...rest,
          isDefault,
          slug: await uniquePlanSlug(rest.name),
          sortOrder: count + 1,
        },
      })
    }
  })

  revalidatePlans()

  return { ok: true as const }
}

export const setPlanActive = async (planId: string, isActive: boolean) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { isDefault: true },
  })
  if (!plan) return { ok: false as const, error: "Plano não encontrado." }
  if (plan.isDefault && !isActive) {
    return {
      ok: false as const,
      error: "O plano padrão não pode ser desativado.",
    }
  }

  await db.plan.update({ where: { id: planId }, data: { isActive } })
  revalidatePlans()

  return { ok: true as const }
}

export const deletePlan = async (planId: string) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { isDefault: true, _count: { select: { barbershops: true } } },
  })
  if (!plan) return { ok: false as const, error: "Plano não encontrado." }
  if (plan.isDefault) {
    return {
      ok: false as const,
      error: "O plano padrão não pode ser excluído.",
    }
  }
  if (plan._count.barbershops > 0) {
    return {
      ok: false as const,
      error:
        "Há barbearias neste plano. Mude o plano delas ou apenas desative este.",
    }
  }

  await db.plan.delete({ where: { id: planId } })
  revalidatePlans()

  return { ok: true as const }
}
