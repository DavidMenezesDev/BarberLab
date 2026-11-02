import { getBarbershopsById } from "@/app/_data/get-barbershop-by-id"
import { getBarbershopOpeningHours } from "@/app/_data/get-opening-hours"
import { SINGLE_BARBERSHOP_ID, isSingleTenant } from "@/app/_lib/deployment"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import CatalogHome from "./_components/catalog-home"
import TenantHome from "./_components/tenant-home"

interface HomeProps {
  searchParams: Promise<{ erro?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  if (!isSingleTenant) return {}

  const barbershop = await getBarbershopsById(SINGLE_BARBERSHOP_ID!)
  if (!barbershop) return {}

  return {
    title: `${barbershop.name} | Agendamento online`,
    description: `Agende online na ${barbershop.name}, em ${barbershop.address}. Veja os serviços, preços e horários disponíveis.`,
  }
}

const Home = async ({ searchParams }: HomeProps) => {
  const { erro } = await searchParams

  if (!isSingleTenant) {
    return <CatalogHome erro={erro} />
  }

  const barbershop = await getBarbershopsById(SINGLE_BARBERSHOP_ID!)
  if (!barbershop) {
    notFound()
  }

  const openingHours = await getBarbershopOpeningHours(barbershop.id)

  return (
    <TenantHome
      barbershop={barbershop}
      openingHours={openingHours}
      erro={erro}
    />
  )
}

export default Home
