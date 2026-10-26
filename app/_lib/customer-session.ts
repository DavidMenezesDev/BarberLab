import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { db } from "./prisma"

const COOKIE_NAME = "barberlab_customer"
const UM_ANO = 60 * 60 * 24 * 365

const segredo = () =>
  (process.env.NEXT_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "").trim()

const assinar = (customerId: string) =>
  createHmac("sha256", segredo()).update(customerId).digest("base64url")

const lerCustomerId = (valor: string | undefined) => {
  if (!valor || !segredo()) return null

  const separador = valor.lastIndexOf(".")
  if (separador <= 0) return null

  const customerId = valor.slice(0, separador)
  const esperado = Buffer.from(assinar(customerId))
  const recebido = Buffer.from(valor.slice(separador + 1))

  if (esperado.length !== recebido.length) return null
  return timingSafeEqual(esperado, recebido) ? customerId : null
}

export const getCurrentCustomerId = async () => {
  const store = await cookies()
  return lerCustomerId(store.get(COOKIE_NAME)?.value)
}

export const getCurrentCustomer = async () => {
  const customerId = await getCurrentCustomerId()
  if (!customerId) return null

  return db.customer.findUnique({ where: { id: customerId } })
}

export const rememberCustomer = async (customerId: string) => {
  const store = await cookies()
  store.set(COOKIE_NAME, `${customerId}.${assinar(customerId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UM_ANO,
  })
}
