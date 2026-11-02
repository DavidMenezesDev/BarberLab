import { requireBarbershopAdmin } from "@/app/_lib/auth"
import { Card, CardContent } from "@/app/_components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BanknoteIcon, HandCoinsIcon, ScissorsIcon } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import EmptyState from "../_components/empty-state"
import PageHeader from "../_components/page-header"
import PeriodNavigator from "../_components/period-navigator"
import StatCard from "../_components/stat-card"
import { getBarberEarnings } from "../_data/get-earnings"
import { formatCurrency, parseDateParam } from "../_lib/format"
import { getPeriodRange } from "../_lib/period"

interface MyEarningsProps {
  searchParams: Promise<{ date?: string }>
}

export const metadata: Metadata = {
  title: "Meus ganhos | Barber Lab",
  description: "Sua comissão e seus cortes na semana.",
}

const MyEarnings = async ({ searchParams }: MyEarningsProps) => {
  const admin = await requireBarbershopAdmin()
  if (!admin) redirect("/entrar")

  const date = parseDateParam((await searchParams).date)
  const { from, to } = getPeriodRange(date, "semana")

  const earnings = await getBarberEarnings(
    admin.barbershopId,
    admin.userId,
    from,
    to,
  )

  if (!earnings) {
    return (
      <div className="mx-auto max-w-6xl p-5 lg:px-8 lg:py-10">
        <EmptyState
          icon={HandCoinsIcon}
          title="Você ainda não é um barbeiro desta unidade"
          description="Os ganhos aparecem aqui quando o seu acesso estiver ligado a um cadastro de barbeiro."
        />
      </div>
    )
  }

  const { barber, cuts, totals } = earnings

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Meus ganhos"
        title="Sua semana"
        description={`Você recebe ${barber.commissionPercent}% de cada atendimento concluído.`}
        action={
          <PeriodNavigator
            basePath="/meus-ganhos"
            date={date}
            period="semana"
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <StatCard
          label="Comissão da semana"
          value={formatCurrency(totals.commission)}
          icon={HandCoinsIcon}
          tone="primary"
        />
        <StatCard
          label="Cortes feitos"
          value={String(totals.cuts)}
          hint={`${formatCurrency(totals.charged)} em serviços`}
          icon={ScissorsIcon}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Atendimentos concluídos
        </h2>

        {cuts.length === 0 ? (
          <EmptyState
            icon={BanknoteIcon}
            title="Nenhum corte concluído nessa semana"
            description="Quando você concluir um atendimento na agenda, a sua comissão aparece aqui."
          />
        ) : (
          <div className="space-y-2">
            {cuts.map((cut) => (
              <Card key={cut.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cut.serviceName}</p>
                    <p className="text-muted-foreground text-xs first-letter:uppercase">
                      {format(cut.date, "EEE, dd/MM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold">
                      {formatCurrency(cut.commission)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      de {formatCurrency(cut.charged)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default MyEarnings
