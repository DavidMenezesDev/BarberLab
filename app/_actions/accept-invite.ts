"use server"

import { Role } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { inviteRegistrationSchema } from "../(admin)/_lib/signup-schema"
import { auth } from "../_lib/auth"
import { hashPassword } from "../_lib/password"
import { db } from "../_lib/prisma"
import {
  consumeRateLimit,
  getClientIp,
  rateLimitError,
} from "../_lib/rate-limit"

const revalidateBarbers = () => {
  revalidatePath("/settings")
  revalidatePath("/barbers")
  revalidatePath("/barbershops", "layout")
  revalidatePath("/")
}

const findOpenInvite = async (token: unknown) => {
  const invite =
    typeof token === "string" && token.length > 0
      ? await db.staffInvite.findUnique({ where: { token } })
      : null

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return null
  }

  return invite
}

// Quem já tem conta (sem barbearia) entra e aceita o convite.
export const acceptStaffInvite = async (token: string) => {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: "Entre na sua conta primeiro." }
  }

  const limit = await consumeRateLimit("acceptInvite", session.user.id)
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const invite = await findOpenInvite(token)
  if (!invite) {
    return { ok: false as const, error: "Convite inválido ou expirado." }
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, barbershopId: true },
  })

  if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      ok: false as const,
      error: `Este convite é para ${invite.email}. Entre com essa conta.`,
    }
  }

  if (user.barbershopId) {
    return {
      ok: false as const,
      error: "Sua conta já está vinculada a uma barbearia.",
    }
  }

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: {
        role: Role.BARBER_ADMIN,
        staffRole: invite.role,
        barbershopId: invite.barbershopId,
      },
    }),
    // Entra direto na lista de barbeiros que o cliente escolhe ao reservar.
    db.barber.upsert({
      where: { userId: session.user.id },
      update: { barbershopId: invite.barbershopId, isActive: true },
      create: {
        name: user.name ?? user.email.split("@")[0],
        barbershopId: invite.barbershopId,
        userId: session.user.id,
      },
    }),
    db.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ])

  revalidateBarbers()

  return { ok: true as const }
}

// Quem ainda não tem conta cria uma com a senha escolhida; o e-mail é o do convite.
export const registerWithInvite = async (input: unknown) => {
  const limit = await consumeRateLimit("acceptInvite", await getClientIp())
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  const parsed = inviteRegistrationSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const invite = await findOpenInvite(parsed.data.token)
  if (!invite) {
    return { ok: false as const, error: "Convite inválido ou expirado." }
  }

  const email = invite.email.toLowerCase()

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: false as const,
      error: "Já existe uma conta com este e-mail. Entre para aceitar.",
    }
  }

  const passwordHash = await hashPassword(parsed.data.password)

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone,
        passwordHash,
        role: Role.BARBER_ADMIN,
        staffRole: invite.role,
        barbershopId: invite.barbershopId,
      },
      select: { id: true },
    })

    // Entra direto na lista de barbeiros que o cliente escolhe ao reservar.
    await tx.barber.create({
      data: {
        name: parsed.data.name,
        barbershopId: invite.barbershopId,
        userId: user.id,
      },
    })

    await tx.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })
  })

  revalidateBarbers()

  return { ok: true as const, email }
}
