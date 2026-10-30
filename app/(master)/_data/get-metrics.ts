import { db } from "@/app/_lib/prisma"
import { Prisma } from "@prisma/client"

const toNumber = (value: Prisma.Decimal | number | null | undefined) =>
  value == null ? 0 : Number(value)

// Faturamento dos atendimentos concluídos (o que passou pelas barbearias, não
// a receita da plataforma). Opcionalmente de uma barbearia só.
export const getCompletedRevenue = async (barbershopId?: string) => {
  const [row] = await db.$queryRaw<{ total: number | null; count: bigint }[]>`
    SELECT COALESCE(SUM(s."price"), 0)::float8 AS total, COUNT(*)::bigint AS count
    FROM "Booking" b
    JOIN "BarbershopService" s ON s."id" = b."serviceId"
    WHERE b."status" = 'COMPLETED'
    ${barbershopId ? Prisma.sql`AND s."barbershopId" = ${barbershopId}` : Prisma.empty}
  `
  return { total: row?.total ?? 0, count: Number(row?.count ?? 0) }
}

export const getPlatformOverview = async () => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    plans,
    byPlan,
    suspended,
    totalBarbershops,
    users,
    disabledUsers,
    bookings30d,
    revenue,
  ] = await Promise.all([
    db.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    db.barbershop.groupBy({
      by: ["planId"],
      where: { suspendedAt: null },
      _count: { _all: true },
    }),
    db.barbershop.count({ where: { suspendedAt: { not: null } } }),
    db.barbershop.count(),
    db.user.count(),
    db.user.count({ where: { disabledAt: { not: null } } }),
    db.booking.count({ where: { createdAt: { gte: since } } }),
    getCompletedRevenue(),
  ])

  const countFor = (planId: string | null) =>
    byPlan.find((row) => row.planId === planId)?._count._all ?? 0

  const breakdown = plans.map((plan) => {
    const barbershops = countFor(plan.id)
    return {
      id: plan.id,
      name: plan.name,
      isActive: plan.isActive,
      price: toNumber(plan.priceMonthly),
      barbershops,
      mrr: toNumber(plan.priceMonthly) * barbershops,
    }
  })

  const mrr = breakdown.reduce((sum, plan) => sum + plan.mrr, 0)

  return {
    mrr,
    arr: mrr * 12,
    activeBarbershops: totalBarbershops - suspended,
    suspendedBarbershops: suspended,
    withoutPlan: countFor(null),
    users,
    disabledUsers,
    bookings30d,
    revenue,
    breakdown,
  }
}

export const getPlans = async () => {
  const plans = await db.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { barbershops: true } } },
  })

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    priceMonthly: toNumber(plan.priceMonthly),
    priceYearly: plan.priceYearly === null ? null : toNumber(plan.priceYearly),
    maxUnits: plan.maxUnits,
    maxBarbers: plan.maxBarbers,
    features: plan.features,
    isActive: plan.isActive,
    isDefault: plan.isDefault,
    barbershopsCount: plan._count.barbershops,
  }))
}

export type MasterPlan = Awaited<ReturnType<typeof getPlans>>[number]
