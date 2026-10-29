"use server"

import { requireBarbershopOwner } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { Role, StaffRole } from "@prisma/client"
import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { inviteSchema } from "../_lib/signup-schema"

const SETE_DIAS = 7 * 24 * 60 * 60 * 1000

export const createStaffInvite = async (input: unknown) => {
  const admin = await requireBarbershopOwner()
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.barbershopId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const email = parsed.data.email.trim().toLowerCase()

  const existing = await db.barbershopMember.findFirst({
    where: {
      barbershopId: admin.barbershopId,
      user: { email: { equals: email, mode: "insensitive" } },
    },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: false as const,
      error: "Essa pessoa já faz parte desta barbearia.",
    }
  }

  const token = randomBytes(24).toString("base64url")

  await db.$transaction([
    db.staffInvite.deleteMany({
      where: { barbershopId: admin.barbershopId, email, acceptedAt: null },
    }),
    db.staffInvite.create({
      data: {
        barbershopId: admin.barbershopId,
        email,
        token,
        role: StaffRole.BARBER,
        expiresAt: new Date(Date.now() + SETE_DIAS),
      },
    }),
  ])

  revalidatePath("/settings")

  return { ok: true as const, token }
}

export const revokeStaffInvite = async (inviteId: string) => {
  const admin = await requireBarbershopOwner()
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  await db.staffInvite.deleteMany({
    where: {
      id: inviteId,
      barbershopId: admin.barbershopId,
      acceptedAt: null,
    },
  })

  revalidatePath("/settings")

  return { ok: true as const }
}

export const removeStaffMember = async (userId: string) => {
  const admin = await requireBarbershopOwner()
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  if (userId === admin.userId) {
    return { ok: false as const, error: "Você não pode remover a si mesmo." }
  }

  const result = await db.barbershopMember.deleteMany({
    where: {
      userId,
      barbershopId: admin.barbershopId,
      staffRole: { not: StaffRole.OWNER },
    },
  })

  if (result.count === 0) {
    return { ok: false as const, error: "Membro não encontrado." }
  }

  // Só perde o acesso ao painel quem não atua em mais nenhuma unidade.
  const remaining = await db.barbershopMember.count({ where: { userId } })
  if (remaining === 0) {
    await db.user.update({
      where: { id: userId },
      data: { role: Role.CUSTOMER },
    })
  }

  // Sai da lista pública; o histórico de agendamentos dele continua.
  await db.barber.updateMany({
    where: { userId, barbershopId: admin.barbershopId },
    data: { isActive: false },
  })

  revalidatePath("/settings")
  revalidatePath("/barbers")
  revalidatePath("/barbershops", "layout")

  return { ok: true as const }
}
