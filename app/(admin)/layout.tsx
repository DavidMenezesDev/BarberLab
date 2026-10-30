import { requireBarbershopAdmin } from "@/app/_lib/auth"
import { getEntitlements } from "@/app/_lib/entitlements"
import { isDemo, isSingleTenant } from "@/app/_lib/deployment"
import { db } from "@/app/_lib/prisma"
import { StaffRole } from "@prisma/client"
import StatusScreen, { HomeButton } from "@/app/_components/status-screen"
import { BanIcon } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AdminSidebar from "./_components/admin-sidebar"
import AdminTabBar from "./_components/admin-tabbar"
import AdminTopbar from "./_components/admin-topbar"
import OnboardingTour from "./_components/onboarding-tour"

export const metadata: Metadata = {
  title: "Painel | Barber Lab",
  description:
    "Gerencie a agenda, os serviços e os atendimentos da sua barbearia.",
  robots: { index: false, follow: false },
}

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const admin = await requireBarbershopAdmin()

  if (!admin) {
    // Sem barbearia vinculada (ou sem login): o cadastro resolve os dois casos.
    redirect("/entrar")
  }

  const [barbershop, user, entitlements] = await Promise.all([
    db.barbershop.findUnique({
      where: { id: admin.barbershopId },
      select: { name: true, imageUrl: true },
    }),
    db.user.findUnique({
      where: { id: admin.userId },
      select: { onboardingDoneAt: true },
    }),
    getEntitlements(admin.barbershopId),
  ])

  if (!barbershop) {
    redirect("/?erro=barbearia-nao-encontrada")
  }

  if (entitlements?.suspended) {
    return (
      <StatusScreen
        icon={<BanIcon className="h-7 w-7" />}
        eyebrow="Acesso suspenso"
        title="Barbearia suspensa"
        description="O acesso a esta barbearia foi suspenso pela plataforma. Fale com o suporte do Barber Lab para regularizar."
      >
        <HomeButton>Voltar ao site</HomeButton>
      </StatusScreen>
    )
  }

  const identity = {
    barbershopName: barbershop.name,
    barbershopImageUrl: barbershop.imageUrl,
    userName: admin.name,
    userImage: admin.image,
  }
  const isOwner = admin.staffRole === StaffRole.OWNER
  const switcher = {
    units: admin.units,
    activeId: admin.barbershopId,
    canCreate: isOwner && !isDemo && !isSingleTenant,
  }

  return (
    <div className="min-h-full">
      <AdminSidebar {...identity} isOwner={isOwner} {...switcher} />
      <AdminTopbar {...identity} {...switcher} />

      <main className="pb-24 lg:pb-0 lg:pl-64">{children}</main>

      <AdminTabBar isOwner={isOwner} multiUnit={admin.units.length > 1} />

      {isOwner && !user?.onboardingDoneAt && <OnboardingTour />}
    </div>
  )
}

export default AdminLayout
