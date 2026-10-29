import { getBarbershopsById } from "@/app/_data/get-barbershop-by-id"
import { getBarbershopOpeningHours } from "@/app/_data/get-opening-hours"
import { requireBarbershopOwner } from "@/app/_lib/auth"
import { notFound, redirect } from "next/navigation"
import type { ComponentProps } from "react"
import type BarbershopDetail from "../(customer)/_components/barbershop-detail"
import PreviewHost from "./preview-host"

export const metadata = { robots: { index: false, follow: false } }

// Página mostrada dentro do iframe de Personalização. Só o dono acessa.
const ThemePreview = async () => {
  const admin = await requireBarbershopOwner()
  if (!admin) redirect("/dashboard")

  const barbershop = await getBarbershopsById(admin.barbershopId)
  if (!barbershop) notFound()

  const openingHours = await getBarbershopOpeningHours(barbershop.id)

  // Sem tema salvo: o painel envia o rascunho pelo iframe. Decimal e Date
  // não atravessam para o componente de cliente, então passa por JSON.
  const plain = JSON.parse(
    JSON.stringify({ ...barbershop, theme: null }),
  ) as ComponentProps<typeof BarbershopDetail>["barbershop"]

  return <PreviewHost barbershop={plain} openingHours={openingHours} />
}

export default ThemePreview
