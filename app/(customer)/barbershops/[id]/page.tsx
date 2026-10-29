import { getBarbershopsById } from "@/app/_data/get-barbershop-by-id"
import { notFound, redirect } from "next/navigation"

// Endereço antigo: a página da barbearia agora vive em /{slug}.
export default async function LegacyBarbershopPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const barbershop = await getBarbershopsById(id)
  if (!barbershop) notFound()

  redirect(`/${barbershop.slug}`)
}
