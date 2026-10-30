import type { WhatsAppMessageStatus } from "@prisma/client"
import { db } from "../prisma"
import { buildBookingCreatedMessage, normalizePhone } from "../whatsapp"
import { toCredentials } from "./credentials"
import { errorMessage, sendText } from "./providers"

const KIND = "BOOKING_CREATED"

interface LogEntry {
  status: WhatsAppMessageStatus
  bookingId: string
  error?: string
  phone?: string | null
  body?: string
  barbershopName?: string
  connection?: { id: string; name: string } | null
}

// O histórico nunca pode quebrar o envio, nem o agendamento.
const writeLog = async ({ connection, ...entry }: LogEntry) => {
  try {
    await db.whatsAppMessageLog.create({
      data: {
        kind: KIND,
        ...entry,
        connectionId: connection?.id,
        connectionName: connection?.name,
      },
    })
  } catch (error) {
    console.error("[whatsapp] falha ao gravar o histórico", error)
  }
}

// Número da própria barbearia, se houver; senão o do sistema. Só conta quem
// está ativo e já foi conectado (phone é preenchido ao confirmar a conexão).
const findConnection = async (barbershopId: string) => {
  const connected = { enabled: true, phone: { not: null } }
  return (
    (await db.whatsAppConnection.findFirst({
      where: { ...connected, barbershopId },
    })) ??
    (await db.whatsAppConnection.findFirst({
      where: { ...connected, isDefault: true, barbershopId: null },
    }))
  )
}

// Avisa o cliente que o horário foi marcado. Nunca lança: uma falha no
// WhatsApp não pode desfazer nem travar o agendamento.
export const notifyBookingCreated = async (bookingId: string) => {
  let entry: LogEntry = { status: "FAILED", bookingId }

  try {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        date: true,
        customer: { select: { name: true, phone: true } },
        barber: { select: { name: true } },
        service: {
          select: {
            name: true,
            price: true,
            durationMinutes: true,
            barbershop: {
              select: { id: true, name: true, address: true, city: true },
            },
          },
        },
      },
    })
    if (!booking) return

    const { barbershop } = booking.service
    entry = { ...entry, barbershopName: barbershop.name }

    const phone = normalizePhone(booking.customer.phone)
    if (!phone) {
      return writeLog({
        ...entry,
        status: "SKIPPED",
        error: "Telefone do cliente inválido.",
        phone: booking.customer.phone,
      })
    }
    entry = { ...entry, phone }

    const connection = await findConnection(barbershop.id)
    if (!connection) {
      return writeLog({
        ...entry,
        status: "SKIPPED",
        error: "Nenhum número conectado e ativo.",
      })
    }
    entry = { ...entry, connection }

    const body = buildBookingCreatedMessage({
      customerName: booking.customer.name,
      barbershopName: barbershop.name,
      barbershopAddress: [barbershop.address, barbershop.city]
        .filter(Boolean)
        .join(", "),
      serviceName: booking.service.name,
      barberName: booking.barber?.name ?? null,
      date: booking.date,
      durationMinutes: booking.service.durationMinutes,
      price: Number(booking.service.price),
    })
    entry = { ...entry, body }

    await sendText(toCredentials(connection), phone, body)
    await writeLog({ ...entry, status: "SENT" })
  } catch (error) {
    console.error("[whatsapp] falha ao avisar o cliente", error)
    await writeLog({ ...entry, status: "FAILED", error: errorMessage(error) })
  }
}
