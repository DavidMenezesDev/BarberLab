import { db } from "@/app/_lib/prisma"
import { BookingStatus } from "@prisma/client"
import { endOfDay, startOfDay } from "date-fns"

export interface AgendaBooking {
  id: string
  date: Date
  status: BookingStatus
  service: {
    id: string
    name: string
    price: number
    durationMinutes: number
  }
  barberName: string | null
  customer: {
    id: string
    name: string
    email: string | null
    phone: string
  }
}

export interface AgendaBlock {
  id: string
  startsAt: Date
  endsAt: Date
  reason: string | null
}

export const getDayAgenda = async (barbershopId: string, date: Date) => {
  const from = startOfDay(date)
  const to = endOfDay(date)

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        date: { gte: from, lte: to },
        service: { barbershopId },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        status: true,
        barber: { select: { name: true } },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            durationMinutes: true,
          },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    }),
    db.scheduleBlock.findMany({
      where: {
        barbershopId,
        startsAt: { lte: to },
        endsAt: { gte: from },
      },
      orderBy: { startsAt: "asc" },
      select: { id: true, startsAt: true, endsAt: true, reason: true },
    }),
  ])

  const agendaBookings: AgendaBooking[] = bookings.map((booking) => ({
    id: booking.id,
    date: booking.date,
    status: booking.status,
    barberName: booking.barber?.name ?? null,
    service: {
      id: booking.service.id,
      name: booking.service.name,
      price: Number(booking.service.price),
      durationMinutes: booking.service.durationMinutes,
    },
    customer: {
      id: booking.customer.id,
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.customer.phone,
    },
  }))

  return { bookings: agendaBookings, blocks: blocks as AgendaBlock[] }
}

export const summarizeAgenda = (bookings: AgendaBooking[]) => {
  const active = bookings.filter(
    (booking) => booking.status !== BookingStatus.CANCELED,
  )

  return {
    total: bookings.length,
    revenue: active.reduce((sum, booking) => sum + booking.service.price, 0),
    completed: bookings.filter(
      (booking) => booking.status === BookingStatus.COMPLETED,
    ).length,
    missed: bookings.filter(
      (booking) =>
        booking.status === BookingStatus.NO_SHOW ||
        booking.status === BookingStatus.CANCELED,
    ).length,
    bookedMinutes: active.reduce(
      (sum, booking) => sum + booking.service.durationMinutes,
      0,
    ),
  }
}
