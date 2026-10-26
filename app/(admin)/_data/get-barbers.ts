import { db } from "@/app/_lib/prisma"

export interface AdminBarber {
  id: string
  name: string
  specialty: string
  imageUrl: string
  isActive: boolean
}

export const getAdminBarbers = async (
  barbershopId: string,
): Promise<AdminBarber[]> => {
  const barbers = await db.barber.findMany({
    where: { barbershopId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      specialty: true,
      imageUrl: true,
      isActive: true,
    },
  })

  return barbers.map((barber) => ({
    ...barber,
    specialty: barber.specialty ?? "",
    imageUrl: barber.imageUrl ?? "",
  }))
}
