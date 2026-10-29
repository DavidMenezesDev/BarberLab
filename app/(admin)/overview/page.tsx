import { requireBarbershopAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { Card, CardContent } from "@/app/_components/ui/card"
import { format, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BanknoteIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  UserXIcon,
} from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import BookingRow from "../_components/booking-row"
import DayNavigator from "../_components/day-navigator"
import EmptyState from "../_components/empty-state"
import PageHeader from "../_components/page-header"
import StatCard from "../_components/stat-card"
import { getOverview } from "../_data/get-overview"
import { formatCurrency, formatDuration, parseDateParam } from "../_lib/format"

interface OverviewProps {
  searchParams: Promise<{ date?: string }>
}

export const metadata: Metadata = {
  title: "Visão geral | Barber Lab",
  description: "Agenda e métricas de todas as unidades juntas.",
}

const Overview = async ({ searchParams }: OverviewProps) => {
  const admin = await requireBarbershopAdmin()
  if (!admin) redirect("/entrar")

  // Com uma unidade só, a visão geral é o próprio dashboard.
  if (admin.units.length < 2) redirect("/dashboard")

  const { date: dateParam } = await searchParams
  const date = parseDateParam(dateParam)

  const [{ perUnit, bookings, summary }, addresses] = await Promise.all([
    getOverview(admin.units, date),
    db.barbershop.findMany({
      where: { id: { in: admin.units.map((unit) => unit.id) } },
      select: { id: true, address: true },
    }),
  ])
  const addressOf = new Map(addresses.map((item) => [item.id, item.address]))

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Todas as unidades"
        title={
          isToday(date)
            ? "Visão geral de hoje"
            : format(date, "dd 'de' MMMM", { locale: ptBR })
        }
        description={`Resumo de ${admin.units.length} unidades juntas.`}
        action={<DayNavigator date={date} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Agendamentos"
          value={String(summary.total)}
          hint={
            summary.bookedMinutes > 0
              ? `${formatDuration(summary.bookedMinutes)} de cadeira`
              : undefined
          }
          icon={CalendarCheckIcon}
          tone="primary"
        />
        <StatCard
          label="Faturamento previsto"
          value={formatCurrency(summary.revenue)}
          hint="Cancelados não contam"
          icon={BanknoteIcon}
          tone="primary"
        />
        <StatCard
          label="Concluídos"
          value={String(summary.completed)}
          icon={CheckCircle2Icon}
        />
        <StatCard
          label="Faltas e cancelamentos"
          value={String(summary.missed)}
          icon={UserXIcon}
          tone={summary.missed > 0 ? "warning" : "default"}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Por unidade
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {perUnit.map(({ unit, summary: unitSummary }) => (
            <Card key={unit.id}>
              <CardContent className="space-y-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{unit.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {addressOf.get(unit.id)}
                  </p>
                </div>
                <dl className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Agend.", String(unitSummary.total)],
                    ["Previsto", formatCurrency(unitSummary.revenue)],
                    ["Concl.", String(unitSummary.completed)],
                    ["Faltas", String(unitSummary.missed)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dd className="text-sm font-bold">{value}</dd>
                      <dt className="text-muted-foreground text-[11px]">
                        {label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Atendimentos do dia
        </h2>

        {bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            title="Nenhum atendimento nesse dia"
            description="Quando um cliente agendar em qualquer unidade, ele aparece aqui."
          />
        ) : (
          <div className="space-y-3">
            {bookings.map(({ booking, unit }) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                barbershopName={unit.name}
                barbershopAddress={addressOf.get(unit.id) ?? ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Overview
