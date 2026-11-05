import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { Prisma } from "@prisma/client"
import { cookies, headers } from "next/headers"
import { VISITOR_COOKIE } from "./constants"
import { isBot, parseUserAgent } from "./user-agent"

// Evento de negócio gravado pelo servidor (cadastro, agendamento...). Nunca
// derruba a ação que o chamou: falha de analytics só vai para o log.
export const trackServerEvent = async (
  name: string,
  props?: Record<string, string | number | boolean | null>,
  path = "/",
) => {
  try {
    const [cookieStore, requestHeaders] = await Promise.all([
      cookies(),
      headers(),
    ])
    const ua = requestHeaders.get("user-agent") ?? ""
    if (isBot(ua)) return

    const visitorId = cookieStore.get(VISITOR_COOKIE)?.value
    const session = await auth().catch(() => null)

    await db.analyticsEvent.create({
      data: {
        type: "EVENT",
        name,
        path,
        visitorId: visitorId?.slice(0, 64) || "server",
        sessionId: "server",
        userId: session?.user?.id ?? null,
        props: props as Prisma.InputJsonValue | undefined,
        ...parseUserAgent(ua),
      },
    })
  } catch (error) {
    console.error("[analytics] falha ao registrar", name, error)
  }
}
