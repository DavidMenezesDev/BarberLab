"use server"

import { revalidatePath } from "next/cache"
import {
  customerSchema,
  toCustomerData,
  type SavedCustomer,
} from "../_lib/customer-schema"
import { getCurrentCustomer } from "../_lib/customer-session"
import { db } from "../_lib/prisma"

export const getSavedCustomer = async (): Promise<SavedCustomer | null> => {
  const customer = await getCurrentCustomer()
  if (!customer) return null

  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? "",
    birthDate: customer.birthDate?.toISOString().slice(0, 10) ?? "",
  }
}

export const updateOwnCustomer = async (input: unknown) => {
  const customer = await getCurrentCustomer()
  if (!customer) {
    return {
      ok: false as const,
      error: "Faça uma reserva para criar seu cadastro.",
    }
  }

  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  await db.customer.update({
    where: { id: customer.id },
    data: toCustomerData(parsed.data),
  })

  revalidatePath("/perfil")
  revalidatePath("/bookings")

  return { ok: true as const }
}
