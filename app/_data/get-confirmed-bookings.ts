"use server"

import { getCurrentCustomerId } from "../_lib/customer-session"
import { db } from "../_lib/prisma"

export const getConfirmedBookings = async () => {
  const customerId = await getCurrentCustomerId()
  if (!customerId) return []
  const bookings = await db.booking.findMany({
    where: {
      customerId,
      date: {
        gte: new Date(),
      },
    },
    select: {
      id: true,
      date: true,
      customer: { select: { name: true } },
      service: {
        select: {
          name: true,
          price: true,
          barbershop: {
            select: {
              name: true,
              address: true,
              imageUrl: true,
              phones: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return bookings.map(toBookingItem)
}

const toBookingItem = (booking: {
  id: string
  date: Date
  customer: { name: string }
  service: {
    name: string
    price: unknown
    barbershop: {
      name: string
      address: string
      imageUrl: string
      phones: string[]
    }
  }
}) => ({
  id: booking.id,
  date: booking.date,
  customerName: booking.customer.name,
  service: {
    name: booking.service.name,
    price: Number(booking.service.price),
    barbershop: booking.service.barbershop,
  },
})
