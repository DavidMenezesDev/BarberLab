"use server"

import { hashPassword } from "@/app/_lib/password"
import { db } from "@/app/_lib/prisma"
import {
  consumeRateLimit,
  getClientIp,
  rateLimitError,
} from "@/app/_lib/rate-limit"
import { uniqueBarbershopSlug } from "@/app/_lib/slug"
import { Role, StaffRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import {
  PLACEHOLDER_BARBERSHOP_IMAGE,
  signupSchema,
} from "../_lib/signup-schema"

export const createBarbershop = async (input: unknown) => {
  const limit = await consumeRateLimit("signup", await getClientIp())
  if (!limit.allowed) {
    return rateLimitError(limit.retryAfterSeconds)
  }

  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const {
    phones,
    imageUrl,
    ownerName,
    ownerPhone,
    document,
    email,
    password,
    // eslint-disable-next-line no-unused-vars
    confirmPassword,
    ...rest
  } = parsed.data

  const normalizedEmail = email.trim().toLowerCase()

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: false as const,
      error: "Já existe uma conta com este e-mail. Use o acesso da barbearia.",
    }
  }

  const [slug, passwordHash] = await Promise.all([
    uniqueBarbershopSlug(rest.name),
    hashPassword(password),
  ])

  await db.$transaction(async (tx) => {
    const barbershop = await tx.barbershop.create({
      data: {
        ...rest,
        slug,
        document: document.replace(/\D/g, "") || null,
        imageUrl: imageUrl || PLACEHOLDER_BARBERSHOP_IMAGE,
        phones: phones.map((phone) => phone.trim()).filter(Boolean),
      },
      select: { id: true },
    })

    await tx.user.create({
      data: {
        name: ownerName,
        email: normalizedEmail,
        phone: ownerPhone,
        passwordHash,
        role: Role.BARBER_ADMIN,
        staffRole: StaffRole.OWNER,
        barbershopId: barbershop.id,
      },
    })
  })

  revalidatePath("/barbershops")
  revalidatePath("/")

  return { ok: true as const, email: normalizedEmail }
}
