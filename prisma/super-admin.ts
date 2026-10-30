import { PrismaClient, Role } from "@prisma/client"
import { hashPassword } from "../app/_lib/password"

// Valores de desenvolvimento. Em produção a senha precisa vir do ambiente.
const DEFAULT_EMAIL = "admin@barberlab.com.br"
const DEFAULT_NAME = "Administrador"
const DEFAULT_PASSWORD = "admin12345"

export interface SuperAdminResult {
  status: "created" | "promoted" | "unchanged" | "skipped"
  email: string
  reason?: string
}

// Idempotente: cria a conta se não existir; se existir, só garante o papel e
// nunca troca a senha de quem já tem conta.
export const ensureSuperAdmin = async (
  prisma: PrismaClient,
  { requireExplicitPassword = process.env.NODE_ENV === "production" } = {},
): Promise<SuperAdminResult> => {
  const email = (
    process.env.SUPER_ADMIN_EMAIL?.trim() || DEFAULT_EMAIL
  ).toLowerCase()
  const name = process.env.SUPER_ADMIN_NAME?.trim() || DEFAULT_NAME
  const password = process.env.SUPER_ADMIN_PASSWORD

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  })

  if (existing) {
    if (existing.role === Role.SUPER_ADMIN)
      return { status: "unchanged", email }

    await prisma.user.update({
      where: { id: existing.id },
      data: { role: Role.SUPER_ADMIN, disabledAt: null },
    })
    return { status: "promoted", email }
  }

  if (!password && requireExplicitPassword) {
    return {
      status: "skipped",
      email,
      reason: "defina SUPER_ADMIN_PASSWORD para criar o super-admin.",
    }
  }
  if (password && password.length < 8) {
    return {
      status: "skipped",
      email,
      reason: "SUPER_ADMIN_PASSWORD precisa ter ao menos 8 caracteres.",
    }
  }

  await prisma.user.create({
    data: {
      email,
      name,
      role: Role.SUPER_ADMIN,
      passwordHash: await hashPassword(password || DEFAULT_PASSWORD),
    },
  })

  return { status: "created", email }
}
