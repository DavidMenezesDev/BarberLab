"use server"

import { BookingStatus } from "@prisma/client"
import { addMinutes, endOfDay, startOfDay } from "date-fns"
import { revalidatePath } from "next/cache"
import {
  customerSchema,
  toCustomerData,
  type CustomerInput,
} from "../_lib/customer-schema"
import {
  getCurrentCustomerId,
  rememberCustomer,
} from "../_lib/customer-session"
import { db } from "../_lib/prisma"
import {
  buildDaySlots,
  findDayHours,
  withDefaults,
} from "../_lib/opening-hours"
import {
  consumeRateLimit,
  getClientIp,
  rateLimitError,
} from "../_lib/rate-limit"

interface CreateBookingParams {
  serviceId: string
  barberId?: string
  date: Date
  customer: CustomerInput
}

const MAXIMO_DE_RESERVAS_EM_ABERTO = 3

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && aEnd > bStart

export const createBooking = async ({
  serviceId,
  barberId,
  date,
  customer,
}: CreateBookingParams) => {
  const limit = await consumeRateLimit("createBooking", await getClientIp())

  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsedCustomer = customerSchema.safeParse(customer)

  if (!parsedCustomer.success) {
    return {
      ok: false as const,
      error: parsedCustomer.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const customerData = toCustomerData(parsedCustomer.data)
  const currentCustomerId = await getCurrentCustomerId()

  const bookingDate = new Date(date)

  if (Number.isNaN(bookingDate.getTime())) {
    return { ok: false as const, error: "Data inválida." }
  }

  if (bookingDate.getTime() <= Date.now()) {
    return { ok: false as const, error: "Escolha um horário no futuro." }
  }

  const service = await db.barbershopService.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      isActive: true,
      durationMinutes: true,
      barbershopId: true,
    },
  })

  if (!service || !service.isActive) {
    return { ok: false as const, error: "Serviço indisponível." }
  }

  // O limite vale por barbearia: quem marca em outra loja não é afetado.
  const emAberto = await db.booking.count({
    where: {
      // O telefone entra na conta para o limite não sumir ao limpar os cookies.
      customer: {
        OR: [
          { phone: customerData.phone },
          ...(currentCustomerId ? [{ id: currentCustomerId }] : []),
        ],
      },
      service: { barbershopId: service.barbershopId },
      status: BookingStatus.CONFIRMED,
      date: { gte: new Date() },
    },
  })

  if (emAberto >= MAXIMO_DE_RESERVAS_EM_ABERTO) {
    return {
      ok: false as const,
      error: `Você já tem ${MAXIMO_DE_RESERVAS_EM_ABERTO} horários marcados nesta barbearia. Conclua ou cancele um para marcar outro.`,
    }
  }

  // Com barbeiros cadastrados, escolher um é obrigatório; sem nenhum, a
  // barbearia segue funcionando como uma agenda única.
  const activeBarbers = await db.barber.findMany({
    where: { barbershopId: service.barbershopId, isActive: true },
    select: { id: true },
  })

  if (activeBarbers.length > 0) {
    if (!barberId) {
      return { ok: false as const, error: "Escolha um barbeiro." }
    }
    if (!activeBarbers.some((barber) => barber.id === barberId)) {
      return { ok: false as const, error: "Barbeiro indisponível." }
    }
  }

  const chosenBarberId = activeBarbers.length > 0 ? barberId : undefined

  const openingHours = withDefaults(
    await db.openingHour.findMany({
      where: { barbershopId: service.barbershopId },
      select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
    }),
  )

  const horarioValido = buildDaySlots(
    findDayHours(openingHours, bookingDate),
    service.durationMinutes,
  ).includes(
    `${String(bookingDate.getHours()).padStart(2, "0")}:${String(
      bookingDate.getMinutes(),
    ).padStart(2, "0")}`,
  )

  if (!horarioValido) {
    return {
      ok: false as const,
      error: "A barbearia não atende nesse horário.",
    }
  }

  const endsAt = addMinutes(bookingDate, service.durationMinutes)
  const from = startOfDay(bookingDate)
  const to = endOfDay(bookingDate)

  const [sameDayBookings, block] = await Promise.all([
    db.booking.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: BookingStatus.CANCELED },
        service: { barbershopId: service.barbershopId },
        // Reservas antigas, sem barbeiro, seguem ocupando a barbearia toda.
        ...(chosenBarberId && {
          OR: [{ barberId: chosenBarberId }, { barberId: null }],
        }),
      },
      select: { date: true, service: { select: { durationMinutes: true } } },
    }),
    db.scheduleBlock.findFirst({
      where: {
        barbershopId: service.barbershopId,
        startsAt: { lt: endsAt },
        endsAt: { gt: bookingDate },
      },
      select: { id: true },
    }),
  ])

  if (block) {
    return {
      ok: false as const,
      error: "Esse horário está bloqueado pela barbearia.",
    }
  }

  const conflict = sameDayBookings.some((booking) =>
    overlaps(
      bookingDate,
      endsAt,
      booking.date,
      addMinutes(booking.date, booking.service.durationMinutes),
    ),
  )

  if (conflict) {
    return {
      ok: false as const,
      error: "Esse horário acabou de ser ocupado. Escolha outro.",
    }
  }

  const existingCustomer = currentCustomerId
    ? await db.customer.findUnique({
        where: { id: currentCustomerId },
        select: { id: true },
      })
    : null

  const savedCustomer = existingCustomer
    ? await db.customer.update({
        where: { id: existingCustomer.id },
        data: customerData,
        select: { id: true },
      })
    : await db.customer.create({ data: customerData, select: { id: true } })

  await db.booking.create({
    data: {
      serviceId,
      barberId: chosenBarberId,
      date: bookingDate,
      customerId: savedCustomer.id,
    },
  })

  await rememberCustomer(savedCustomer.id)

  revalidatePath("/barbershops", "page")
  revalidatePath("/bookings", "page")
  revalidatePath("/dashboard")
  revalidatePath("/schedule")

  return { ok: true as const }
}
