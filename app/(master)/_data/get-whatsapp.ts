import { db } from "@/app/_lib/prisma"

// Sem apiKey nem instanceToken: a tela nunca recebe os segredos.
export const getWhatsAppConnections = async () => {
  const [connections, barbershops] = await Promise.all([
    db.whatsAppConnection.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        provider: true,
        baseUrl: true,
        sessionName: true,
        phone: true,
        enabled: true,
        isDefault: true,
        barbershopId: true,
        barbershop: { select: { name: true } },
      },
    }),
    db.barbershop.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  return { connections, barbershops }
}

export type WhatsAppConnectionRow = Awaited<
  ReturnType<typeof getWhatsAppConnections>
>["connections"][number]

export const getWhatsAppLogs = (limit = 100) =>
  db.whatsAppMessageLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  })

export type WhatsAppLogRow = Awaited<ReturnType<typeof getWhatsAppLogs>>[number]
