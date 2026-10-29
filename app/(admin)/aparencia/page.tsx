import { requireBarbershopOwner } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { parseStoredTheme } from "@/app/_lib/theme"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import AppearanceForm from "../_components/appearance-form"
import PageHeader from "../_components/page-header"

export const metadata: Metadata = {
  title: "Personalização | Barber Lab",
  description: "Cores, fontes e imagens da página pública da barbearia.",
}

const Appearance = async () => {
  const admin = await requireBarbershopOwner()
  if (!admin) redirect("/dashboard")

  const barbershop = await db.barbershop.findUnique({
    where: { id: admin.barbershopId },
    select: {
      logoUrl: true,
      theme: true,
    },
  })
  if (!barbershop) notFound()

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-5 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Link público"
        title="Personalização"
        description="Cores, fontes e imagens da página que o cliente abre para agendar."
      />

      <AppearanceForm
        logoUrl={barbershop.logoUrl ?? ""}
        theme={parseStoredTheme(barbershop.theme)}
      />
    </div>
  )
}

export default Appearance
