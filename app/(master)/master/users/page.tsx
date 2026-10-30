import PageHeader from "@/app/(admin)/_components/page-header"
import { Badge } from "@/app/_components/ui/badge"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Select } from "@/app/_components/ui/select"
import { notFound } from "next/navigation"
import { requireSuperAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { Prisma, Role } from "@prisma/client"
import { SearchIcon } from "lucide-react"
import UserAccessSwitch from "../../_components/user-access-switch"

interface MasterUsersProps {
  searchParams: Promise<{ q?: string; role?: string }>
}

const PAGE_SIZE = 100

const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Cliente",
  BARBER_ADMIN: "Barbearia",
  SUPER_ADMIN: "Plataforma",
}

const MasterUsers = async ({ searchParams }: MasterUsersProps) => {
  // O layout sozinho não protege: o Next renderiza a página em paralelo.
  if (!(await requireSuperAdmin())) notFound()

  const { q, role } = await searchParams
  const term = q?.trim()
  const self = await requireSuperAdmin()

  const where: Prisma.UserWhereInput = {
    ...(term && {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ],
    }),
    ...(role && role in ROLE_LABEL ? { role: role as Role } : {}),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabledAt: true,
        createdAt: true,
        memberships: {
          select: { barbershop: { select: { name: true } } },
          take: 3,
        },
      },
    }),
    db.user.count({ where }),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Usuários"
        description="Bloqueie ou libere o acesso de qualquer conta."
      />

      <form className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Nome ou e-mail"
            className="pl-9"
          />
        </div>
        <Select name="role" defaultValue={role ?? ""} className="sm:w-44">
          <option value="">Todos os tipos</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit">Filtrar</Button>
      </form>

      <p className="text-muted-foreground text-xs">
        {total} {total === 1 ? "usuário" : "usuários"}
        {total > PAGE_SIZE && ` (mostrando os ${PAGE_SIZE} mais recentes)`}
      </p>

      <Card>
        <CardContent className="divide-y p-0">
          {users.length === 0 && (
            <p className="text-muted-foreground p-6 text-center text-sm">
              Nenhum usuário encontrado.
            </p>
          )}
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {user.name ?? user.email}
                  </p>
                  <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
                  {user.disabledAt && (
                    <Badge variant="destructive">Bloqueado</Badge>
                  )}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {user.email}
                  {user.memberships.length > 0 &&
                    ` · ${user.memberships.map((m) => m.barbershop.name).join(", ")}`}
                </p>
              </div>
              <UserAccessSwitch
                userId={user.id}
                active={user.disabledAt === null}
                locked={
                  user.role === Role.SUPER_ADMIN || user.id === self?.userId
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

export default MasterUsers
