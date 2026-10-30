"use server"

import { requireBarbershopOwner } from "@/app/_lib/auth"
import { getEntitlements } from "@/app/_lib/entitlements"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { revalidatePath } from "next/cache"
import { barberSchema } from "../_lib/barber-schema"

const revalidateBarbers = () => {
  revalidatePath("/barbers")
}

export const upsertBarber = async (input: unknown) => {
  const admin = await requireBarbershopOwner()
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = barberSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { id, specialty, imageUrl, ...rest } = parsed.data
  const data = {
    ...rest,
    specialty: specialty || null,
    imageUrl: imageUrl || null,
  }

  if (id) {
    const result = await db.barber.updateMany({
      where: { id, barbershopId: admin.barbershopId },
      data,
    })

    if (result.count === 0) {
      return { ok: false as const, error: "Barbeiro não encontrado." }
    }
  } else {
    const entitlements = await getEntitlements(admin.barbershopId)
    if (entitlements?.suspended) {
      return { ok: false as const, error: "Barbearia indisponível." }
    }
    const maxBarbers = entitlements?.maxBarbers
    if (maxBarbers != null) {
      const total = await db.barber.count({
        where: { barbershopId: admin.barbershopId },
      })
      if (total >= maxBarbers) {
        return {
          ok: false as const,
          error: `Seu plano permite ${maxBarbers} barbeiros.`,
        }
      }
    }

    await db.barber.create({
      data: { ...data, barbershopId: admin.barbershopId },
    })
  }

  revalidateBarbers()

  return { ok: true as const }
}

export const setBarberActive = async (barberId: string, isActive: boolean) => {
  const admin = await requireBarbershopOwner()
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const result = await db.barber.updateMany({
    where: { id: barberId, barbershopId: admin.barbershopId },
    data: { isActive },
  })

  if (result.count === 0) {
    return { ok: false as const, error: "Barbeiro não encontrado." }
  }

  revalidateBarbers()

  return { ok: true as const }
}

export const deleteBarber = async (barberId: string) => {
  const admin = await requireBarbershopOwner()
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const barber = await db.barber.findFirst({
    where: { id: barberId, barbershopId: admin.barbershopId },
    select: { _count: { select: { bookings: true } } },
  })

  if (!barber) {
    return { ok: false as const, error: "Barbeiro não encontrado." }
  }

  if (barber._count.bookings > 0) {
    return {
      ok: false as const,
      error:
        "Esse barbeiro já tem agendamentos e não pode ser removido. Desative-o para tirá-lo do site.",
    }
  }

  await db.barber.delete({ where: { id: barberId } })

  revalidateBarbers()

  return { ok: true as const }
}
