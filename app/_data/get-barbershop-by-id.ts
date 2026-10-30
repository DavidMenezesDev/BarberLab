"use server"

import { db } from "../_lib/prisma"

export const getBarbershopsById = async (barbershopId: string) => {
  if (!barbershopId) {
    return null
  }

  return db.barbershop.findFirst({
    // A URL pública usa o slug; o id continua valendo para links antigos.
    where: {
      OR: [{ id: barbershopId }, { slug: barbershopId }],
      suspendedAt: null,
    },
    include: {
      services: true,
      barbers: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, specialty: true, imageUrl: true },
      },
    },
  })
}
