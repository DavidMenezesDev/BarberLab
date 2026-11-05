import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import { consumeRateLimit, getClientIp } from "@/app/_lib/rate-limit"
import { Prisma } from "@prisma/client"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import {
  EVENT_TYPES,
  IGNORED_PATH_PREFIXES,
} from "@/app/_lib/analytics/constants"
import { isBot, parseUserAgent } from "@/app/_lib/analytics/user-agent"

const id = z.string().regex(/^[A-Za-z0-9-]{8,64}$/)
const short = (max: number) => z.string().trim().max(max).optional()

const schema = z.object({
  type: z.enum(EVENT_TYPES),
  name: short(120),
  path: z.string().startsWith("/").max(300),
  referrer: short(300),
  visitorId: id,
  sessionId: id,
  utmSource: short(80),
  utmMedium: short(80),
  utmCampaign: short(80),
  props: z
    .record(
      z.string().max(40),
      z.union([z.string().max(300), z.number(), z.boolean()]),
    )
    .refine((value) => Object.keys(value).length <= 10)
    .optional(),
})

const empty = () => new NextResponse(null, { status: 204 })

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? ""
  if (isBot(ua)) return empty()

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new NextResponse(null, { status: 400 })

  const data = parsed.data
  if (IGNORED_PATH_PREFIXES.some((prefix) => data.path.startsWith(prefix))) {
    return empty()
  }

  const limit = await consumeRateLimit("analytics", await getClientIp())
  if (!limit.allowed) return new NextResponse(null, { status: 429 })

  const session = await auth().catch(() => null)

  // Referrer só interessa quando vem de fora do próprio site.
  let referrer: string | null = null
  if (data.referrer) {
    try {
      const host = new URL(data.referrer).hostname
      if (host !== request.nextUrl.hostname) referrer = host
    } catch {}
  }

  await db.analyticsEvent
    .create({
      data: {
        ...data,
        referrer,
        props: data.props as Prisma.InputJsonValue | undefined,
        userId: session?.user?.id ?? null,
        ...parseUserAgent(ua),
      },
    })
    .catch((error) => console.error("[analytics] falha ao gravar", error))

  return empty()
}
