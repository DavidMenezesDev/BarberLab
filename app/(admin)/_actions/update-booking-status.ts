"use server"

import { requireBarbershopAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { BookingStatus, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { splitCommission } from "../_lib/commission"

const schema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(BookingStatus),
})

export const updateBookingStatus = async (input: unknown) => {
  const admin = await requireBarbershopAdmin()
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "Dados inválidos." }
  }

  const booking = await db.booking.findFirst({
    where: {
      id: parsed.data.bookingId,
      // A visão geral age em qualquer unidade em que a pessoa atua.
      service: { barbershop: { members: { some: { userId: admin.userId } } } },
    },
    select: {
      status: true,
      service: { select: { price: true } },
      barber: { select: { commissionPercent: true } },
    },
  })

  if (!booking) {
    return { ok: false as const, error: "Agendamento não encontrado." }
  }

  const { status } = parsed.data
  const data: Prisma.BookingUpdateInput = { status }

  if (status !== BookingStatus.COMPLETED) {
    // Sair de "concluído" desfaz o ganho: reabrir ou cancelar não paga ninguém.
    data.chargedAmount = null
    data.commissionPercent = null
    data.commissionAmount = null
  } else if (booking.status !== BookingStatus.COMPLETED) {
    // A comissão é fixada aqui, com o preço e a porcentagem de agora.
    const percent = Number(booking.barber?.commissionPercent ?? 0)
    const split = splitCommission(Number(booking.service.price), percent)
    data.chargedAmount = split.charged
    data.commissionPercent = percent
    data.commissionAmount = split.commission
  }

  await db.booking.update({ where: { id: parsed.data.bookingId }, data })

  revalidatePath("/dashboard")
  revalidatePath("/overview")
  revalidatePath("/schedule")
  revalidatePath("/financeiro")
  revalidatePath("/meus-ganhos")
  revalidatePath("/bookings")

  return { ok: true as const }
}
