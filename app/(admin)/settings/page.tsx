import { requireBarbershopOwner } from "@/app/_lib/auth"
import { withDefaults } from "@/app/_lib/opening-hours"
import { db } from "@/app/_lib/prisma"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import BarbershopProfileForm from "../_components/barbershop-profile-form"
import OpeningHoursForm from "../_components/opening-hours-form"
import PageHeader from "../_components/page-header"
import StaffManager from "../_components/staff-manager"
import { StaffRole } from "@prisma/client"

export const metadata: Metadata = {
  title: "Configurações | Barber Lab",
  description: "Dados da barbearia e horário de funcionamento.",
}

const Settings = async () => {
  const admin = await requireBarbershopOwner()
  if (!admin) redirect("/dashboard")

  const [barbershop, salvos, staff, invites] = await Promise.all([
    db.barbershop.findUnique({
      where: { id: admin.barbershopId },
      select: {
        name: true,
        slug: true,
        address: true,
        description: true,
        imageUrl: true,
        features: true,
        phones: true,
      },
    }),
    db.openingHour.findMany({
      where: { barbershopId: admin.barbershopId },
      orderBy: { weekday: "asc" },
      select: { weekday: true, opensAt: true, closesAt: true, isClosed: true },
    }),
    db.barbershopMember.findMany({
      where: { barbershopId: admin.barbershopId },
      orderBy: { createdAt: "asc" },
      select: {
        staffRole: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.staffInvite.findMany({
      where: {
        barbershopId: admin.barbershopId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, token: true, expiresAt: true },
    }),
  ])

  if (!barbershop) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-5 lg:px-8 lg:py-10">
      <section className="space-y-6">
        <PageHeader
          eyebrow="Configurações"
          title="Dados da barbearia"
          description="Nome, endereço, foto e telefones que o cliente vê antes de agendar."
        />

        <BarbershopProfileForm
          slug={barbershop.slug}
          profile={{
            name: barbershop.name,
            address: barbershop.address,
            description: barbershop.description,
            imageUrl: barbershop.imageUrl,
            features: barbershop.features,
            phones: barbershop.phones.length > 0 ? barbershop.phones : [""],
          }}
        />
      </section>

      <section className="space-y-6">
        <PageHeader
          eyebrow="Configurações"
          title="Horário de funcionamento"
          description="Define os horários que aparecem para o cliente na hora de agendar."
        />

        <OpeningHoursForm hours={withDefaults(salvos)} />
      </section>

      <section className="space-y-6">
        <PageHeader
          eyebrow="Configurações"
          title="Acesso da equipe"
          description="Quem pode entrar no painel desta barbearia."
        />

        <StaffManager
          members={staff.map((member) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            isOwner: member.staffRole === StaffRole.OWNER,
            isSelf: member.user.id === admin.userId,
          }))}
          invites={invites.map((invite) => ({
            ...invite,
            expiresAt: invite.expiresAt.toISOString(),
          }))}
        />
      </section>
    </div>
  )
}

export default Settings
