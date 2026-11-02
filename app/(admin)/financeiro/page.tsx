import { requireBarbershopOwner } from "@/app/_lib/auth"
import { Card, CardContent } from "@/app/_components/ui/card"
import {
  BanknoteIcon,
  HandCoinsIcon,
  ScissorsIcon,
  StoreIcon,
} from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import EmptyState from "../_components/empty-state"
import PageHeader from "../_components/page-header"
import PeriodNavigator from "../_components/period-navigator"
import StatCard from "../_components/stat-card"
import { getBarbershopEarnings } from "../_data/get-earnings"
import { formatCurrency, parseDateParam } from "../_lib/format"
import { getPeriodRange, parsePeriod } from "../_lib/period"

interface FinanceProps {
  searchParams: Promise<{ date?: string; periodo?: string }>
}

export const metadata: Metadata = {
  title: "Financeiro | Barber Lab",
  description: "Comissões dos barbeiros e resultado da barbearia.",
}

const Finance = async ({ searchParams }: FinanceProps) => {
  const admin = await requireBarbershopOwner()
  if (!admin) redirect("/dashboard")

  const params = await searchParams
  const date = parseDateParam(params.date)
  const period = parsePeriod(params.periodo)
  const { from, to } = getPeriodRange(date, period)

  const { perBarber, totals } = await getBarbershopEarnings(
    admin.barbershopId,
    from,
    to,
  )

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Financeiro"
        title="Comissões e resultado"
        description="Conta só atendimentos concluídos. A comissão é fixada na hora da conclusão."
        action={
          <PeriodNavigator
            basePath="/financeiro"
            date={date}
            period={period}
            allowMonth
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Faturamento total"
          value={formatCurrency(totals.charged)}
          icon={BanknoteIcon}
          tone="primary"
        />
        <StatCard
          label="Pago aos barbeiros"
          value={formatCurrency(totals.commission)}
          icon={HandCoinsIcon}
        />
        <StatCard
          label="Líquido da barbearia"
          value={formatCurrency(totals.house)}
          icon={StoreIcon}
          tone="primary"
        />
        <StatCard
          label="Atendimentos"
          value={String(totals.cuts)}
          icon={ScissorsIcon}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Por barbeiro
        </h2>

        {perBarber.length === 0 ? (
          <EmptyState
            icon={ScissorsIcon}
            title="Nenhum barbeiro cadastrado"
            description="Cadastre a equipe em Barbeiros e defina a comissão de cada um."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {perBarber.map((barber) => (
              <Card key={barber.barberId ?? "none"}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-semibold">{barber.name}</p>
                    {barber.barberId && (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {barber.commissionPercent}% de comissão
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ["Cortes", String(barber.cuts)],
                      ["Faturou", formatCurrency(barber.charged)],
                      ["Recebeu", formatCurrency(barber.commission)],
                      ["Barbearia", formatCurrency(barber.house)],
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
        )}
      </section>
    </div>
  )
}

export default Finance
