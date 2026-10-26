import type { Metadata } from "next"
import { requireBarbershopOwner } from "@/app/_lib/auth"
import { UsersIcon } from "lucide-react"
import { redirect } from "next/navigation"
import BarbersManager from "../_components/barbers-manager"
import PageHeader from "../_components/page-header"
import StatCard from "../_components/stat-card"
import { getAdminBarbers } from "../_data/get-barbers"

export const metadata: Metadata = {
  title: "Barbeiros | Barber Lab",
  description: "Equipe de barbeiros da barbearia.",
}

const Barbers = async () => {
  const admin = await requireBarbershopOwner()
  if (!admin) redirect("/dashboard")

  const barbers = await getAdminBarbers(admin.barbershopId)
  const active = barbers.filter((barber) => barber.isActive)

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Equipe"
        title="Barbeiros"
        description="Quem atende na sua barbearia."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard
          label="Em atividade"
          value={`${active.length}/${barbers.length}`}
          icon={UsersIcon}
          tone="primary"
        />
      </div>

      <div className="space-y-3">
        <BarbersManager barbers={barbers} />
      </div>
    </div>
  )
}

export default Barbers
