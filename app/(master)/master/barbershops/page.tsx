import { notFound } from "next/navigation"
import { requireSuperAdmin } from "@/app/_lib/auth"
import PageHeader from "@/app/(admin)/_components/page-header"
import { Badge } from "@/app/_components/ui/badge"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Select } from "@/app/_components/ui/select"
import { db } from "@/app/_lib/prisma"
import { Prisma, StaffRole } from "@prisma/client"
import { ChevronRightIcon, SearchIcon } from "lucide-react"
import Link from "next/link"

interface MasterBarbershopsProps {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>
}

const PAGE_SIZE = 100

const MasterBarbershops = async ({ searchParams }: MasterBarbershopsProps) => {
  // O layout sozinho não protege: o Next renderiza a página em paralelo.
  if (!(await requireSuperAdmin())) notFound()

  const { q, plan, status } = await searchParams
  const term = q?.trim()

  const where: Prisma.BarbershopWhereInput = {
    ...(term && {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { city: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        {
          members: {
            some: { user: { email: { contains: term, mode: "insensitive" } } },
          },
        },
      ],
    }),
    ...(plan === "none" ? { planId: null } : plan ? { planId: plan } : {}),
    ...(status === "suspended"
      ? { suspendedAt: { not: null } }
      : status === "active"
        ? { suspendedAt: null }
        : {}),
  }

  const [plans, barbershops, total] = await Promise.all([
    db.plan.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.barbershop.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        city: true,
        suspendedAt: true,
        createdAt: true,
        plan: { select: { name: true } },
        _count: { select: { barbers: true, services: true } },
        members: {
          where: { staffRole: StaffRole.OWNER },
          take: 1,
          select: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    db.barbershop.count({ where }),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Barbearias"
        description="Plano, status e funcionalidades de cada barbearia."
      />

      <form className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Nome, cidade, link ou e-mail do dono"
            className="pl-9"
          />
        </div>
        <Select name="plan" defaultValue={plan ?? ""} className="sm:w-44">
          <option value="">Todos os planos</option>
          <option value="none">Sem plano</option>
          {plans.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="sm:w-40">
          <option value="">Qualquer status</option>
          <option value="active">Ativas</option>
          <option value="suspended">Suspensas</option>
        </Select>
        <Button type="submit">Filtrar</Button>
      </form>

      <p className="text-muted-foreground text-xs">
        {total} {total === 1 ? "barbearia" : "barbearias"}
        {total > PAGE_SIZE && ` (mostrando as ${PAGE_SIZE} mais recentes)`}
      </p>

      <Card>
        <CardContent className="divide-y p-0">
          {barbershops.length === 0 && (
            <p className="text-muted-foreground p-6 text-center text-sm">
              Nenhuma barbearia encontrada.
            </p>
          )}
          {barbershops.map((barbershop) => {
            const owner = barbershop.members[0]?.user
            return (
              <Link
                key={barbershop.id}
                href={`/master/barbershops/${barbershop.id}`}
                className="hover:bg-accent/50 flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{barbershop.name}</p>
                    {barbershop.suspendedAt && (
                      <Badge variant="destructive">Suspensa</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {owner?.email ?? "Sem dono"}
                    {barbershop.city && ` · ${barbershop.city}`}
                  </p>
                </div>
                <div className="hidden text-right text-xs sm:block">
                  <p className="text-muted-foreground">
                    {barbershop._count.barbers} barbeiros ·{" "}
                    {barbershop._count.services} serviços
                  </p>
                </div>
                <Badge variant={barbershop.plan ? "secondary" : "outline"}>
                  {barbershop.plan?.name ?? "Sem plano"}
                </Badge>
                <ChevronRightIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}

export default MasterBarbershops
