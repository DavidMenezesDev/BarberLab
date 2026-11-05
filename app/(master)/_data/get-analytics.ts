import { db } from "@/app/_lib/prisma"
import { EVENTS } from "@/app/_lib/analytics/constants"
import { Prisma } from "@prisma/client"

export const ANALYTICS_RANGES = [1, 7, 30, 90] as const
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

export const parseRange = (value?: string): AnalyticsRange => {
  const days = Number(value)
  return (ANALYTICS_RANGES as readonly number[]).includes(days)
    ? (days as AnalyticsRange)
    : 7
}

const TZ = "America/Sao_Paulo"

interface Row {
  label: string
  total: number
  visitors: number
}

const rows = (
  list: { label: string | null; total: bigint; visitors: bigint }[],
): Row[] =>
  list.map((row) => ({
    label: row.label ?? "Direto / desconhecido",
    total: Number(row.total),
    visitors: Number(row.visitors),
  }))

export const getAnalytics = async (days: AnalyticsRange) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const previousSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000)
  const realtimeSince = new Date(Date.now() - 5 * 60 * 1000)

  const group = (column: Prisma.Sql, type: string, limit = 10) =>
    db.$queryRaw<{ label: string | null; total: bigint; visitors: bigint }[]>`
      SELECT ${column} AS label, COUNT(*)::bigint AS total,
             COUNT(DISTINCT "visitorId")::bigint AS visitors
      FROM "AnalyticsEvent"
      WHERE "type" = ${type} AND "createdAt" >= ${since}
      GROUP BY 1 ORDER BY total DESC LIMIT ${limit}
    `

  const totalsFor = (from: Date, to: Date) =>
    db.$queryRaw<
      {
        pageviews: bigint
        visitors: bigint
        sessions: bigint
        clicks: bigint
        signups: bigint
        bookings: bigint
      }[]
    >`
      SELECT
        COUNT(*) FILTER (WHERE "type" = 'PAGEVIEW')::bigint AS pageviews,
        COUNT(DISTINCT "visitorId") FILTER (WHERE "type" <> 'EVENT')::bigint AS visitors,
        COUNT(DISTINCT "sessionId") FILTER (WHERE "type" <> 'EVENT')::bigint AS sessions,
        COUNT(*) FILTER (WHERE "type" = 'CLICK')::bigint AS clicks,
        COUNT(*) FILTER (WHERE "name" = ${EVENTS.signupCompleted})::bigint AS signups,
        COUNT(*) FILTER (WHERE "name" = ${EVENTS.bookingCreated})::bigint AS bookings
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
    `

  const [
    [current],
    [previous],
    [realtime],
    daily,
    pages,
    referrers,
    clicks,
    devices,
    browsers,
    systems,
    campaigns,
    [funnel],
    recent,
  ] = await Promise.all([
    totalsFor(since, new Date()),
    totalsFor(previousSince, since),
    db.$queryRaw<{ visitors: bigint }[]>`
      SELECT COUNT(DISTINCT "visitorId")::bigint AS visitors
      FROM "AnalyticsEvent"
      WHERE "type" <> 'EVENT' AND "createdAt" >= ${realtimeSince}
    `,
    db.$queryRaw<{ day: string; pageviews: bigint; visitors: bigint }[]>`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
             COALESCE(e.pageviews, 0)::bigint AS pageviews,
             COALESCE(e.visitors, 0)::bigint AS visitors
      FROM generate_series(
        (${since}::timestamptz AT TIME ZONE ${TZ})::date,
        (now() AT TIME ZONE ${TZ})::date,
        interval '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TZ})::date AS day,
               COUNT(*) FILTER (WHERE "type" = 'PAGEVIEW') AS pageviews,
               COUNT(DISTINCT "visitorId") FILTER (WHERE "type" <> 'EVENT') AS visitors
        FROM "AnalyticsEvent" WHERE "createdAt" >= ${since}
        GROUP BY 1
      ) e ON e.day = d.day
      ORDER BY d.day
    `,
    group(Prisma.sql`"path"`, "PAGEVIEW"),
    group(Prisma.sql`"referrer"`, "PAGEVIEW"),
    group(Prisma.sql`"name"`, "CLICK", 15),
    group(Prisma.sql`"device"`, "PAGEVIEW"),
    group(Prisma.sql`"browser"`, "PAGEVIEW"),
    group(Prisma.sql`"os"`, "PAGEVIEW"),
    group(
      Prisma.sql`NULLIF(concat_ws(' / ', "utmSource", "utmMedium", "utmCampaign"), '')`,
      "PAGEVIEW",
    ),
    db.$queryRaw<{ landing: bigint; signupPage: bigint; signups: bigint }[]>`
      SELECT
        COUNT(DISTINCT "visitorId") FILTER (WHERE "type" = 'PAGEVIEW' AND "path" = '/')::bigint AS landing,
        COUNT(DISTINCT "visitorId") FILTER (WHERE "type" = 'PAGEVIEW' AND "path" = '/cadastro')::bigint AS "signupPage",
        COUNT(DISTINCT "visitorId") FILTER (WHERE "name" = ${EVENTS.signupCompleted})::bigint AS signups
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${since}
    `,
    db.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        type: true,
        name: true,
        path: true,
        device: true,
        createdAt: true,
      },
    }),
  ])

  const n = (value: bigint | undefined) => Number(value ?? 0)
  const totals = (row: typeof current) => ({
    pageviews: n(row?.pageviews),
    visitors: n(row?.visitors),
    sessions: n(row?.sessions),
    clicks: n(row?.clicks),
    signups: n(row?.signups),
    bookings: n(row?.bookings),
  })

  return {
    days,
    totals: totals(current),
    previous: totals(previous),
    onlineNow: n(realtime?.visitors),
    daily: daily.map((row) => ({
      day: row.day,
      pageviews: Number(row.pageviews),
      visitors: Number(row.visitors),
    })),
    pages: rows(pages),
    referrers: rows(referrers),
    clicks: rows(clicks),
    devices: rows(devices),
    browsers: rows(browsers),
    systems: rows(systems),
    campaigns: rows(campaigns),
    funnel: {
      landing: n(funnel?.landing),
      signupPage: n(funnel?.signupPage),
      signups: n(funnel?.signups),
    },
    recent,
  }
}

export type PlatformAnalytics = Awaited<ReturnType<typeof getAnalytics>>
