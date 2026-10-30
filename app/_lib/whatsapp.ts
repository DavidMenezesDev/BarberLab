import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const DEFAULT_COUNTRY_CODE = "55"

export const normalizePhone = (
  phone: string | null | undefined,
): string | null => {
  if (!phone) return null

  const hasExplicitCountryCode = phone.trim().startsWith("+")

  let digits = phone.replace(/\D/g, "")
  if (!digits) return null

  if (hasExplicitCountryCode) {
    return digits.length >= 8 && digits.length <= 15 ? digits : null
  }

  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "")
  }

  if (digits.length === 10 || digits.length === 11) {
    return `${DEFAULT_COUNTRY_CODE}${digits}`
  }

  if (
    digits.startsWith(DEFAULT_COUNTRY_CODE) &&
    (digits.length === 12 || digits.length === 13)
  ) {
    return digits
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return digits
  }

  return null
}

export interface WhatsAppBookingInfo {
  serviceName: string
  date: Date
  barbershopName: string
  barbershopAddress?: string | null
  customerName?: string | null
  price?: number | null
}

const formatPrice = (price: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    price,
  )

const formatWhen = (date: Date) => ({
  day: format(date, "dd/MM/yyyy", { locale: ptBR }),
  weekday: format(date, "EEEE", { locale: ptBR }),
  time: format(date, "HH:mm", { locale: ptBR }),
})

export const buildCustomerConfirmationMessage = ({
  serviceName,
  date,
  barbershopName,
  customerName,
  price,
}: WhatsAppBookingInfo) => {
  const { day, weekday, time } = formatWhen(date)

  return [
    `Olá, ${barbershopName}! Acabei de agendar pelo Barber Lab.`,
    "",
    `*Serviço:* ${serviceName}`,
    `*Data:* ${day} (${weekday})`,
    `*Horário:* ${time}`,
    price != null ? `*Valor:* ${formatPrice(price)}` : null,
    customerName ? `*Cliente:* ${customerName}` : null,
    "",
    "Podem confirmar, por favor?",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

export const buildBarberReminderMessage = ({
  serviceName,
  date,
  barbershopName,
  barbershopAddress,
  customerName,
}: WhatsAppBookingInfo) => {
  const { day, weekday, time } = formatWhen(date)
  const greeting = customerName ? `Olá, ${customerName}!` : "Olá!"

  return [
    `${greeting} Aqui é da ${barbershopName}, passando para lembrar do seu horário.`,
    "",
    `*Serviço:* ${serviceName}`,
    `*Data:* ${day} (${weekday})`,
    `*Horário:* ${time}`,
    barbershopAddress ? `*Endereço:* ${barbershopAddress}` : null,
    "",
    "Podemos confirmar sua presença?",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

export interface BookingCreatedInfo {
  customerName: string
  barbershopName: string
  barbershopAddress?: string | null
  serviceName: string
  barberName?: string | null
  date: Date
  durationMinutes: number
  price: number
}

// Mensagem enviada ao cliente, pela barbearia, assim que o horário é marcado.
export const buildBookingCreatedMessage = ({
  customerName,
  barbershopName,
  barbershopAddress,
  serviceName,
  barberName,
  date,
  durationMinutes,
  price,
}: BookingCreatedInfo) => {
  const { day, weekday, time } = formatWhen(date)

  return [
    `Olá, ${customerName.split(" ")[0]}! Seu horário na *${barbershopName}* está confirmado. ✅`,
    "",
    `*Serviço:* ${serviceName} (${durationMinutes} min)`,
    barberName ? `*Barbeiro:* ${barberName}` : null,
    `*Data:* ${day} (${weekday})`,
    `*Horário:* ${time}`,
    `*Valor:* ${formatPrice(price)}`,
    barbershopAddress ? `*Endereço:* ${barbershopAddress}` : null,
    "",
    "Se precisar remarcar ou cancelar, fale com a barbearia. Até lá!",
  ]
    .filter((line) => line !== null)
    .join("\n")
}

export const buildWhatsAppUrl = ({
  phone,
  message,
}: {
  phone?: string | null
  message: string
}) => {
  const normalized = normalizePhone(phone)
  const text = encodeURIComponent(message)

  return normalized
    ? `https://wa.me/${normalized}?text=${text}`
    : `https://wa.me/?text=${text}`
}
