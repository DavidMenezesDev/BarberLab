"use server"

import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "../_lib/auth"
import { getCurrentCustomerId } from "../_lib/customer-session"
import { db } from "../_lib/prisma"

export const deleteBooking = async (bookingId: string) => {
  const [session, customerId] = await Promise.all([
    auth(),
    getCurrentCustomerId(),
  ])

  if (!session?.user && !customerId) {
    return { ok: false as const, error: "Reserva não encontrada." }
  }

  if (typeof bookingId !== "string" || bookingId.length === 0) {
    return { ok: false as const, error: "Reserva inválida." }
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      customerId: true,
      service: { select: { barbershopId: true } },
    },
  })

  if (!booking) {
    return { ok: false as const, error: "Reserva não encontrada." }
  }

  const isOwner = !!customerId && booking.customerId === customerId
  const isBarbershopAdmin =
    session?.user?.role === Role.BARBER_ADMIN &&
    session.user.barbershopId === booking.service.barbershopId

  if (!isOwner && !isBarbershopAdmin) {
    return { ok: false as const, error: "Reserva não encontrada." }
  }

  await db.booking.delete({ where: { id: bookingId } })

  revalidatePath("/bookings", "page")
  revalidatePath("/", "page")
  revalidatePath("/dashboard")
  revalidatePath("/schedule")

  return { ok: true as const }
}
