import { notFound } from "next/navigation"
import { requireSuperAdmin } from "@/app/_lib/auth"
import { formatCurrency } from "@/app/(admin)/_lib/format"
import PageHeader from "@/app/(admin)/_components/page-header"
import StatCard from "@/app/(admin)/_components/stat-card"
import { Badge } from "@/app/_components/ui/badge"
import { Card, CardContent } from "@/app/_components/ui/card"
import {
  BanIcon,
  BanknoteIcon,
  BuildingIcon,
  CalendarCheckIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { getPlatformOverview } from "../_data/get-metrics"

const MasterOverview = async () => {
  // O layout sozinho não protege: o Next renderiza a página em paralelo.
  if (!(await requireSuperAdmin())) notFound()

  const overview = await getPlatformOverview()

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Visão geral"
        description="Receita recorrente, barbearias e uso da plataforma."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          icon={BanknoteIcon}
          tone="primary"
          label="Receita mensal (MRR)"
          value={formatCurrency(overview.mrr)}
          hint={`${formatCurrency(overview.arr)} por ano`}
        />
        <StatCard
          icon={BuildingIcon}
          label="Barbearias ativas"
          value={String(overview.activeBarbershops)}
          hint={
            overview.withoutPlan > 0
              ? `${overview.withoutPlan} sem plano (acesso total)`
              : undefined
          }
        />
        <StatCard
          icon={BanIcon}
          tone={overview.suspendedBarbershops > 0 ? "warning" : "default"}
          label="Barbearias suspensas"
          value={String(overview.suspendedBarbershops)}
        />
        <StatCard
          icon={UsersIcon}
          label="Usuários"
          value={String(overview.users)}
          hint={
            overview.disabledUsers > 0
              ? `${overview.disabledUsers} bloqueados`
              : undefined
          }
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Agendamentos (30 dias)"
          value={String(overview.bookings30d)}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Faturado pelas barbearias"
          value={formatCurrency(overview.revenue.total)}
          hint={`${overview.revenue.count} atendimentos concluídos`}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Receita por plano
        </h2>
        <Card>
          <CardContent className="divide-y p-0">
            {overview.breakdown.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{plan.name}</span>
                  {!plan.isActive && <Badge variant="outline">Inativo</Badge>}
                </div>
                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <span>
                    {plan.barbershops}{" "}
                    {plan.barbershops === 1 ? "barbearia" : "barbearias"} ×{" "}
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-foreground w-28 text-right font-semibold">
                    {formatCurrency(plan.mrr)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-muted-foreground text-xs">
          MRR = barbearias não suspensas × preço mensal do plano. O valor
          faturado pelas barbearias é o dos atendimentos concluídos, não a
          receita da plataforma.
        </p>
      </section>
    </>
  )
}

export default MasterOverview
