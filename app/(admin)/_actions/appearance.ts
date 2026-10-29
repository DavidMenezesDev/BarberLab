"use server"

import { requireBarbershopOwner } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { appearanceSchema } from "../_lib/appearance-schema"

export const saveBarbershopAppearance = async (input: unknown) => {
  const admin = await requireBarbershopOwner()
  if (!admin) {
    return { ok: false as const, error: "Acesso negado." }
  }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = appearanceSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const { theme, logoUrl } = parsed.data

  await db.barbershop.update({
    where: { id: admin.barbershopId },
    data: {
      theme: theme ?? Prisma.DbNull,
      logoUrl: logoUrl || null,
    },
  })

  revalidatePath("/aparencia")
  revalidatePath("/")
  revalidatePath("/[slug]", "page")

  return { ok: true as const }
}
