"use server"

import { hashPassword } from "@/app/_lib/password"
import { db } from "@/app/_lib/prisma"
import {
  consumeRateLimit,
  getClientIp,
  rateLimitError,
} from "@/app/_lib/rate-limit"
import { checkSlug } from "@/app/_lib/slug"
import { Prisma, Role, StaffRole } from "@prisma/client"
import { revalidatePath } from "next/cache"
import {
  PLACEHOLDER_BARBERSHOP_IMAGE,
  signupSchema,
} from "../_lib/signup-schema"

// Consulta ao vivo no formulário de cadastro, antes de enviar.
export const checkSlugAvailability = async (slug: string) => {
  const limit = await consumeRateLimit("checkSlug", await getClientIp())
  if (!limit.allowed) return rateLimitError(limit.retryAfterSeconds)

  return checkSlug(slug.trim().toLowerCase())
}

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
    slug,
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

  const slugCheck = await checkSlug(slug)
  if (!slugCheck.ok) return slugCheck

  const [passwordHash, defaultPlan] = await Promise.all([
    hashPassword(password),
    db.plan.findFirst({
      where: { isDefault: true, isActive: true },
      select: { id: true },
    }),
  ])

  try {
    await db.$transaction(async (tx) => {
      const barbershop = await tx.barbershop.create({
        data: {
          ...rest,
          slug,
          planId: defaultPlan?.id ?? null,
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
          memberships: {
            create: { barbershopId: barbershop.id, staffRole: StaffRole.OWNER },
          },
        },
      })
    })
  } catch (error) {
    // Outro cadastro levou o mesmo endereço entre a checagem e a criação.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      String(error.meta?.target).includes("slug")
    ) {
      return {
        ok: false as const,
        error: "Este endereço já está em uso. Escolha outro.",
      }
    }
    throw error
  }

  revalidatePath("/barbershops")
  revalidatePath("/")

  return { ok: true as const, email: normalizedEmail }
}
