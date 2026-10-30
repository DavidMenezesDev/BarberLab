"use server"

import { db } from "../_lib/prisma"

export const getGroupBySlug = async (slug: string) => {
  if (!slug) return null

  return db.barbershopGroup.findUnique({
    where: { slug },
    select: {
      name: true,
      barbershops: {
        where: { suspendedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          imageUrl: true,
          phones: true,
        },
      },
    },
  })
}
