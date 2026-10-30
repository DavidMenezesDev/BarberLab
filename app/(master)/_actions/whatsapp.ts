"use server"

import { requireSuperAdmin } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, rateLimitError } from "@/app/_lib/rate-limit"
import { encryptSecret } from "@/app/_lib/secret"
import { toCredentials } from "@/app/_lib/whatsapp/credentials"
import {
  disconnect,
  errorMessage,
  getConnectionStatus,
  startConnection,
  type ConnectionStatus,
} from "@/app/_lib/whatsapp/providers"
import { normalizePhone } from "@/app/_lib/whatsapp"
import { revalidatePath } from "next/cache"
import { whatsappSchema } from "../_lib/whatsapp-schema"

const revalidateWhatsApp = () => revalidatePath("/master/whatsapp")

const guard = async () => {
  const admin = await requireSuperAdmin()
  if (!admin) return { error: "Acesso negado." as const }

  const limit = await consumeRateLimit("adminWrite", admin.userId)
  if (!limit.allowed)
    return { error: rateLimitError(limit.retryAfterSeconds).error }

  return { admin }
}

const findConnection = (id: string) =>
  db.whatsAppConnection.findUnique({ where: { id } })

export const saveWhatsAppConnection = async (input: unknown) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const parsed = whatsappSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }
  const { id, apiKey, ...data } = parsed.data

  if (data.isDefault && data.barbershopId) {
    return {
      ok: false as const,
      error: "O número padrão é do sistema, não de uma barbearia.",
    }
  }
  if (!data.isDefault && !data.barbershopId) {
    return {
      ok: false as const,
      error: "Escolha uma barbearia ou marque como número padrão do sistema.",
    }
  }
  if (data.barbershopId) {
    const taken = await db.whatsAppConnection.findFirst({
      where: { barbershopId: data.barbershopId, NOT: id ? { id } : undefined },
      select: { id: true },
    })
    if (taken) {
      return {
        ok: false as const,
        error: "Essa barbearia já tem um número próprio.",
      }
    }
  }

  const current = id ? await findConnection(id) : null
  if (id && !current)
    return { ok: false as const, error: "Conexão não encontrada." }
  if (!current && !apiKey) {
    return { ok: false as const, error: "Informe a chave da API." }
  }

  await db.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.whatsAppConnection.updateMany({
        where: { isDefault: true, NOT: id ? { id } : undefined },
        data: { isDefault: false },
      })
    }

    if (current) {
      // Provedor, URL e sessão definem a conexão; para trocá-los, crie outra.
      await tx.whatsAppConnection.update({
        where: { id: current.id },
        data: {
          name: data.name,
          barbershopId: data.barbershopId,
          isDefault: data.isDefault,
          ...(apiKey && { apiKey: encryptSecret(apiKey) }),
        },
      })
    } else {
      await tx.whatsAppConnection.create({
        data: { ...data, apiKey: encryptSecret(apiKey) },
      })
    }
  })

  revalidateWhatsApp()
  return { ok: true as const }
}

// Marca como conectada (guardando o número) ou desconectada, conforme o provedor.
const sync = async (id: string, status: ConnectionStatus) => {
  if (status.state === "CONNECTED") {
    await db.whatsAppConnection.update({
      where: { id },
      data: { phone: status.phone ?? "conectado" },
    })
  } else if (status.state === "DISCONNECTED" || status.state === "ERROR") {
    await db.whatsAppConnection.update({
      where: { id },
      data: { phone: null },
    })
  }
}

// Inicia a conexão: devolve QR code ou, se informado um número, o código de
// pareamento. A tela repete checkWhatsAppConnection até conectar.
export const startWhatsAppConnection = async (id: string, phone?: string) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const connection = await findConnection(id)
  if (!connection)
    return { ok: false as const, error: "Conexão não encontrada." }

  const pairing = phone ? normalizePhone(phone) : null
  if (phone && !pairing) {
    return { ok: false as const, error: "Número inválido." }
  }

  try {
    const result = await startConnection(
      toCredentials(connection),
      pairing ?? undefined,
    )
    if (result.instanceToken) {
      await db.whatsAppConnection.update({
        where: { id },
        data: { instanceToken: encryptSecret(result.instanceToken) },
      })
    }
    await sync(id, result)
    revalidateWhatsApp()
    return { ok: true as const, status: result }
  } catch (cause) {
    return { ok: false as const, error: errorMessage(cause) }
  }
}

export const checkWhatsAppConnection = async (id: string, phone?: string) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const connection = await findConnection(id)
  if (!connection)
    return { ok: false as const, error: "Conexão não encontrada." }

  try {
    const status = await getConnectionStatus(
      toCredentials(connection),
      (phone && normalizePhone(phone)) || undefined,
    )
    const changed = (status.state === "CONNECTED") !== Boolean(connection.phone)
    await sync(id, status)
    if (changed) revalidateWhatsApp()
    return { ok: true as const, status }
  } catch (cause) {
    return { ok: false as const, error: errorMessage(cause) }
  }
}

export const disconnectWhatsApp = async (id: string) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  const connection = await findConnection(id)
  if (!connection)
    return { ok: false as const, error: "Conexão não encontrada." }

  try {
    await disconnect(toCredentials(connection))
  } catch (cause) {
    return { ok: false as const, error: errorMessage(cause) }
  }
  await db.whatsAppConnection.update({ where: { id }, data: { phone: null } })
  revalidateWhatsApp()
  return { ok: true as const }
}

export const setWhatsAppEnabled = async (id: string, enabled: boolean) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  await db.whatsAppConnection.update({ where: { id }, data: { enabled } })
  revalidateWhatsApp()
  return { ok: true as const }
}

export const deleteWhatsAppConnection = async (id: string) => {
  const { error } = await guard()
  if (error) return { ok: false as const, error }

  await db.whatsAppConnection.delete({ where: { id } })
  revalidateWhatsApp()
  return { ok: true as const }
}
