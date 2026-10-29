import { getGroupBySlug } from "@/app/_data/get-group-by-slug"
import { getBarbershopsById } from "@/app/_data/get-barbershop-by-id"
import { getBarbershopOpeningHours } from "@/app/_data/get-opening-hours"
import { db } from "@/app/_lib/prisma"
import { SINGLE_BARBERSHOP_ID, isSingleTenant } from "@/app/_lib/deployment"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import BarbershopDetail from "../_components/barbershop-detail"
import UnitPicker from "../_components/unit-picker"

interface BarbershopPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: BarbershopPageProps): Promise<Metadata> {
  const { slug } = await params
  const barbershop = await getBarbershopsById(slug)

  if (!barbershop) {
    const group = await getGroupBySlug(slug)
    if (group) {
      return {
        title: `${group.name} | Barber Lab`,
        description: `Escolha a unidade da ${group.name} e agende online.`,
      }
    }

    return { title: "Barbearia não encontrada | Barber Lab" }
  }

  return {
    title: `${barbershop.name} | Barber Lab`,
    description: `Agende online na ${barbershop.name}, em ${barbershop.address}. Veja os serviços, preços e horários disponíveis.`,
  }
}

export default async function BarbershopPage({ params }: BarbershopPageProps) {
  const { slug } = await params

  const barbershop = await getBarbershopsById(slug)
  if (!barbershop) {
    const group = await getGroupBySlug(slug)
    if (!group || isSingleTenant || group.barbershops.length === 0) notFound()

    // Com uma unidade só, não há o que escolher.
    if (group.barbershops.length === 1) {
      redirect(`/${group.barbershops[0].slug}`)
    }

    return <UnitPicker name={group.name} units={group.barbershops} />
  }

  if (isSingleTenant) {
    if (barbershop.id === SINGLE_BARBERSHOP_ID) redirect("/")
    notFound()
  }

  // Link antigo (pelo id): leva para o endereço com o nome da barbearia.
  if (slug !== barbershop.slug) redirect(`/${barbershop.slug}`)

  const openingHours = await getBarbershopOpeningHours(barbershop.id)

  const group = barbershop.groupId
    ? await db.barbershopGroup.findUnique({
        where: { id: barbershop.groupId },
        select: {
          name: true,
          slug: true,
          _count: { select: { barbershops: true } },
        },
      })
    : null

  return (
    <BarbershopDetail
      barbershop={barbershop}
      openingHours={openingHours}
      otherUnitsHref={
        group && group._count.barbershops > 1 ? `/${group.slug}` : undefined
      }
    />
  )
}
