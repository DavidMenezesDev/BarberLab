"use server"

import { requireSuperAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { isFeatureKey, parseFeatureOverrides } from "@/app/_lib/features"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

const guard = async () => {
  const admin = await requireSuperAdmin()
  if (!admin) return { error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.userId)
  if (!limit.allowed)
    return { error: rateLimitError(limit.retryAfterSeconds).error }

  return { admin }
}

// Plano, suspensão e exceções mudam o que o público e o painel enxergam.
const revalidateBarbershop = () => {
  revalidatePath("/master", "layout")
  revalidatePath("/", "layout")
}

export const assignPlan = async (
  barbershopId: string,
  planId: string | null,
) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  if (planId) {
    const plan = await db.plan.findUnique({
      where: { id: planId },
      select: { id: true },
    })
    if (!plan) return { ok: false as const, error: "Plano não encontrado." }
  }

  const result = await db.barbershop.updateMany({
    where: { id: barbershopId },
    data: { planId },
  })
  if (result.count === 0) {
    return { ok: false as const, error: "Barbearia não encontrada." }
  }

  revalidateBarbershop()
  return { ok: true as const }
}

export const setBarbershopSuspended = async (
  barbershopId: string,
  suspended: boolean,
) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const result = await db.barbershop.updateMany({
    where: { id: barbershopId },
    data: { suspendedAt: suspended ? new Date() : null },
  })
  if (result.count === 0) {
    return { ok: false as const, error: "Barbearia não encontrada." }
  }

  revalidateBarbershop()
  return { ok: true as const }
}

// `value` nulo remove a exceção e devolve a decisão ao plano.
export const setFeatureOverride = async (
  barbershopId: string,
  feature: string,
  value: boolean | null,
) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  if (!isFeatureKey(feature)) {
    return { ok: false as const, error: "Funcionalidade desconhecida." }
  }

  const barbershop = await db.barbershop.findUnique({
    where: { id: barbershopId },
    select: { featureOverrides: true },
  })
  if (!barbershop) {
    return { ok: false as const, error: "Barbearia não encontrada." }
  }

  const overrides = parseFeatureOverrides(barbershop.featureOverrides)
  if (value === null) delete overrides[feature]
  else overrides[feature] = value

  await db.barbershop.update({
    where: { id: barbershopId },
    data: {
      featureOverrides:
        Object.keys(overrides).length > 0 ? overrides : Prisma.DbNull,
    },
  })

  revalidateBarbershop()
  return { ok: true as const }
}
