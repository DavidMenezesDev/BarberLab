import type { AdminUnit } from "@/app/_lib/auth"
import { getDayAgenda, summarizeAgenda } from "./get-day-agenda"

// Agenda do dia de todas as unidades, com o resumo de cada uma e o total.
export const getOverview = async (units: AdminUnit[], date: Date) => {
  const perUnit = await Promise.all(
    units.map(async (unit) => {
      const { bookings } = await getDayAgenda(unit.id, date)
      return { unit, bookings, summary: summarizeAgenda(bookings) }
    }),
  )

  const bookings = perUnit
    .flatMap(({ unit, bookings }) =>
      bookings.map((booking) => ({ booking, unit })),
    )
    .sort((a, b) => a.booking.date.getTime() - b.booking.date.getTime())

  return {
    perUnit,
    bookings,
    summary: summarizeAgenda(bookings.map(({ booking }) => booking)),
  }
}
