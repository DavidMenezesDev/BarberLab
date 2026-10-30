import { requireSuperAdmin } from "@/app/_lib/auth"
import { formatCurrency } from "@/app/(admin)/_lib/format"
import PageHeader from "@/app/(admin)/_components/page-header"
import StatCard from "@/app/(admin)/_components/stat-card"
import { Badge } from "@/app/_components/ui/badge"
import { Card, CardContent } from "@/app/_components/ui/card"
import { parseFeatureOverrides } from "@/app/_lib/features"
import { db } from "@/app/_lib/prisma"
import {
  BanknoteIcon,
  CalendarCheckIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import BarbershopControls from "../../../_components/barbershop-controls"
import { getCompletedRevenue } from "../../../_data/get-metrics"

interface MasterBarbershopProps {
  params: Promise<{ id: string }>
}

const MasterBarbershop = async ({ params }: MasterBarbershopProps) => {
  // O layout sozinho não protege: o Next renderiza a página em paralelo.
  if (!(await requireSuperAdmin())) notFound()

  const { id } = await params

  const [barbershop, plans, revenue, bookings] = await Promise.all([
    db.barbershop.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        address: true,
        document: true,
        suspendedAt: true,
        createdAt: true,
        planId: true,
        featureOverrides: true,
        plan: { select: { name: true, priceMonthly: true, features: true } },
        _count: { select: { barbers: true, services: true } },
        members: {
          orderBy: { createdAt: "asc" },
          select: {
            staffRole: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    db.plan.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, isActive: true, features: true },
    }),
    getCompletedRevenue(id),
    db.booking.count({ where: { service: { barbershopId: id } } }),
  ])

  if (!barbershop) notFound()

  const monthly = barbershop.plan ? Number(barbershop.plan.priceMonthly) : 0

  return (
    <>
      <div className="space-y-3">
        <Link
          href="/master/barbershops"
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          ← Barbearias
        </Link>
        <PageHeader
          eyebrow={barbershop.city ?? "Barbearia"}
          title={barbershop.name}
          description={`${barbershop.address} · cadastrada em ${barbershop.createdAt.toLocaleDateString("pt-BR")}`}
          action={
            <Link
              href={`/${barbershop.slug}`}
              className="text-primary text-sm hover:underline"
              target="_blank"
            >
              Ver página pública
            </Link>
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={BanknoteIcon}
          tone="primary"
          label="Mensalidade"
          value={
            barbershop.suspendedAt ? formatCurrency(0) : formatCurrency(monthly)
          }
          hint={barbershop.plan?.name ?? "Sem plano"}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Agendamentos"
          value={String(bookings)}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Faturado (concluídos)"
          value={formatCurrency(revenue.total)}
          hint={`${revenue.count} atendimentos`}
        />
        <StatCard
          icon={UsersIcon}
          label="Equipe"
          value={String(barbershop._count.barbers)}
          hint={`${barbershop._count.services} serviços`}
        />
      </div>

      <BarbershopControls
        barbershopId={barbershop.id}
        planId={barbershop.planId}
        suspended={barbershop.suspendedAt !== null}
        plans={plans}
        overrides={parseFeatureOverrides(barbershop.featureOverrides)}
      />

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Acesso ao painel
        </h2>
        <Card>
          <CardContent className="divide-y p-0">
            {barbershop.members.map((member) => (
              <div
                key={member.user.email}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.user.name ?? member.user.email}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {member.user.email}
                  </p>
                </div>
                <Badge variant="secondary">
                  {member.staffRole === "OWNER" ? "Dono" : "Barbeiro"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export default MasterBarbershop
