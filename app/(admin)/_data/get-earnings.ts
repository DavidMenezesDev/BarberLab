import { db } from "@/app/_lib/prisma"
import { BookingStatus } from "@prisma/client"

interface CompletedCut {
  id: string
  date: Date
  serviceName: string
  barberId: string | null
  charged: number
  commission: number
  house: number
}

// Atendimentos concluídos no período, já com a divisão gravada na conclusão.
const getCompletedCuts = async (
  where: { barbershopId: string; barberId?: string },
  from: Date,
  to: Date,
): Promise<CompletedCut[]> => {
  const bookings = await db.booking.findMany({
    where: {
      status: BookingStatus.COMPLETED,
      date: { gte: from, lte: to },
      service: { barbershopId: where.barbershopId },
      ...(where.barberId ? { barberId: where.barberId } : {}),
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      barberId: true,
      chargedAmount: true,
      commissionAmount: true,
      service: { select: { name: true, price: true } },
    },
  })

  return bookings.map((booking) => {
    // Sem a foto gravada (dado antigo), vale o preço atual sem comissão.
    const charged = Number(booking.chargedAmount ?? booking.service.price)
    const commission = Number(booking.commissionAmount ?? 0)
    return {
      id: booking.id,
      date: booking.date,
      serviceName: booking.service.name,
      barberId: booking.barberId,
      charged,
      commission,
      house: Math.round((charged - commission) * 100) / 100,
    }
  })
}

const sum = (cuts: CompletedCut[], key: "charged" | "commission" | "house") =>
  Math.round(cuts.reduce((total, cut) => total + cut[key], 0) * 100) / 100

export interface BarberEarnings {
  barberId: string | null
  name: string
  commissionPercent: number
  cuts: number
  charged: number
  commission: number
  house: number
}

// Painel do dono: quanto cada barbeiro recebeu, o líquido da barbearia e o total.
export const getBarbershopEarnings = async (
  barbershopId: string,
  from: Date,
  to: Date,
) => {
  const [cuts, barbers] = await Promise.all([
    getCompletedCuts({ barbershopId }, from, to),
    db.barber.findMany({
      where: { barbershopId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true, commissionPercent: true },
    }),
  ])

  const perBarber: BarberEarnings[] = []
  for (const barber of barbers) {
    const own = cuts.filter((cut) => cut.barberId === barber.id)
    // Quem está inativo só aparece se atendeu no período.
    if (!barber.isActive && own.length === 0) continue

    perBarber.push({
      barberId: barber.id,
      name: barber.name,
      commissionPercent: Number(barber.commissionPercent),
      cuts: own.length,
      charged: sum(own, "charged"),
      commission: sum(own, "commission"),
      house: sum(own, "house"),
    })
  }

  // Atendimentos sem barbeiro (ou de barbeiro removido) ficam todos com a casa.
  const known = new Set(barbers.map((barber) => barber.id))
  const orphan = cuts.filter((cut) => !cut.barberId || !known.has(cut.barberId))
  if (orphan.length > 0) {
    perBarber.push({
      barberId: null,
      name: "Sem barbeiro definido",
      commissionPercent: 0,
      cuts: orphan.length,
      charged: sum(orphan, "charged"),
      commission: sum(orphan, "commission"),
      house: sum(orphan, "house"),
    })
  }

  return {
    perBarber,
    totals: {
      cuts: cuts.length,
      charged: sum(cuts, "charged"),
      commission: sum(cuts, "commission"),
      house: sum(cuts, "house"),
    },
  }
}

// Painel do barbeiro: só o que é dele.
export const getBarberEarnings = async (
  barbershopId: string,
  userId: string,
  from: Date,
  to: Date,
) => {
  const barber = await db.barber.findFirst({
    where: { barbershopId, userId },
    select: { id: true, name: true, commissionPercent: true },
  })

  if (!barber) return null

  const cuts = await getCompletedCuts(
    { barbershopId, barberId: barber.id },
    from,
    to,
  )

  return {
    barber: {
      name: barber.name,
      commissionPercent: Number(barber.commissionPercent),
    },
    cuts,
    totals: {
      cuts: cuts.length,
      charged: sum(cuts, "charged"),
      commission: sum(cuts, "commission"),
    },
  }
}
