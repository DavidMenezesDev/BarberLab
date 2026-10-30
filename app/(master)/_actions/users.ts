"use server"

import { requireSuperAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"

export const setUserDisabled = async (userId: string, disabled: boolean) => {
  const admin = await requireSuperAdmin()
  if (!admin) return { ok: false as const, error: "Acesso negado." }

  const limit = await consumeRateLimit("adminWrite", admin.userId)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  if (userId === admin.userId) {
    return { ok: false as const, error: "Você não pode bloquear a si mesmo." }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  if (!user) return { ok: false as const, error: "Usuário não encontrado." }
  if (user.role === Role.SUPER_ADMIN) {
    return {
      ok: false as const,
      error: "Contas da plataforma não podem ser bloqueadas por aqui.",
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { disabledAt: disabled ? new Date() : null },
  })

  revalidatePath("/master/users")
  return { ok: true as const }
}
