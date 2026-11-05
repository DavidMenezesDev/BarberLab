import PageHeader from "@/app/(admin)/_components/page-header"
import StatCard from "@/app/(admin)/_components/stat-card"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { requireSuperAdmin } from "@/app/_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarCheckIcon,
  EyeIcon,
  MousePointerClickIcon,
  RadioIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ANALYTICS_RANGES,
  getAnalytics,
  parseRange,
} from "../../_data/get-analytics"

const nf = new Intl.NumberFormat("pt-BR")

const delta = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? "novo no período" : undefined
  const pct = Math.round(((current - previous) / previous) * 100)
  return `${pct > 0 ? "+" : ""}${pct}% vs. período anterior`
}

const RANK_EMPTY = "Sem dados no período."

const Ranking = ({
  title,
  items,
  unit = "visitas",
}: {
  title: string
  items: { label: string; total: number; visitors: number }[]
  unit?: string
}) => {
  const max = Math.max(1, ...items.map((item) => item.total))

  return (
    <section className="space-y-3">
      <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
        {title}
      </h2>
      <Card>
        <CardContent className="space-y-3 p-4">
          {items.length === 0 && (
            <p className="text-muted-foreground text-sm">{RANK_EMPTY}</p>
          )}
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate" title={item.label}>
                  {item.label}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {nf.format(item.total)} {unit} · {nf.format(item.visitors)}{" "}
                  {item.visitors === 1 ? "visitante" : "visitantes"}
                </span>
              </div>
              <div className="bg-secondary h-1.5 rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

interface AnalyticsPageProps {
  searchParams: Promise<{ dias?: string }>
}

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  if (!(await requireSuperAdmin())) notFound()

  const { dias } = await searchParams
  const days = parseRange(dias)
  const data = await getAnalytics(days)
  const { totals, previous, funnel } = data
  const maxDay = Math.max(1, ...data.daily.map((day) => day.pageviews))

  const funnelSteps = [
    { label: "Visitaram a landing page", value: funnel.landing },
    { label: "Abriram o cadastro", value: funnel.signupPage },
    { label: "Concluíram o cadastro", value: funnel.signups },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Analytics"
        description="Acessos e interações em todo o sistema. Sem IP nem dados pessoais."
        action={
          <div className="flex gap-1">
            {ANALYTICS_RANGES.map((range) => (
              <Button
                key={range}
                size="sm"
                variant={range === days ? "default" : "outline"}
                asChild
              >
                <Link href={`/master/analytics?dias=${range}`}>
                  {range === 1 ? "24h" : `${range} dias`}
                </Link>
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          icon={RadioIcon}
          tone="primary"
          label="Online agora"
          value={nf.format(data.onlineNow)}
          hint="visitantes nos últimos 5 min"
        />
        <StatCard
          icon={UsersIcon}
          label="Visitantes únicos"
          value={nf.format(totals.visitors)}
          hint={delta(totals.visitors, previous.visitors)}
        />
        <StatCard
          icon={EyeIcon}
          label="Visualizações de página"
          value={nf.format(totals.pageviews)}
          hint={`${nf.format(totals.sessions)} sessões · ${delta(totals.pageviews, previous.pageviews) ?? "sem comparação"}`}
        />
        <StatCard
          icon={MousePointerClickIcon}
          label="Cliques"
          value={nf.format(totals.clicks)}
          hint={delta(totals.clicks, previous.clicks)}
        />
        <StatCard
          icon={UserPlusIcon}
          label="Cadastros de barbearia"
          value={nf.format(totals.signups)}
          hint={delta(totals.signups, previous.signups)}
        />
        <StatCard
          icon={CalendarCheckIcon}
          label="Agendamentos feitos"
          value={nf.format(totals.bookings)}
          hint={delta(totals.bookings, previous.bookings)}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Visualizações por dia
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex h-40 items-end gap-1">
              {data.daily.map((day) => (
                <div
                  key={day.day}
                  className="group relative flex h-full flex-1 items-end"
                  title={`${format(new Date(`${day.day}T12:00:00`), "dd/MM", { locale: ptBR })}: ${day.pageviews} visualizações, ${day.visitors} visitantes`}
                >
                  <div
                    className="bg-primary/70 group-hover:bg-primary w-full rounded-t"
                    style={{
                      height: `${Math.max((day.pageviews / maxDay) * 100, day.pageviews ? 2 : 0)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="text-muted-foreground mt-2 flex justify-between text-xs">
              <span>
                {data.daily[0] &&
                  format(new Date(`${data.daily[0].day}T12:00:00`), "dd/MM")}
              </span>
              <span>pico: {nf.format(maxDay)} por dia</span>
              <span>
                {data.daily.at(-1) &&
                  format(
                    new Date(`${data.daily.at(-1)!.day}T12:00:00`),
                    "dd/MM",
                  )}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Funil de conversão
        </h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            {funnelSteps.map((step, index) => {
              const first = funnelSteps[0].value
              const prev = funnelSteps[index - 1]?.value
              return (
                <div key={step.label} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span>{step.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {nf.format(step.value)} visitantes
                      {prev
                        ? ` · ${Math.round((step.value / prev) * 100)}% do passo anterior`
                        : ""}
                    </span>
                  </div>
                  <div className="bg-secondary h-2 rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${first ? (step.value / first) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Ranking title="Páginas mais acessadas" items={data.pages} />
        <Ranking title="Origem do tráfego" items={data.referrers} />
        <Ranking
          title="Cliques mais frequentes"
          items={data.clicks}
          unit="cliques"
        />
        <Ranking title="Campanhas (UTM)" items={data.campaigns} />
        <Ranking title="Dispositivos" items={data.devices} />
        <Ranking title="Navegadores" items={data.browsers} />
        <Ranking title="Sistemas operacionais" items={data.systems} />
      </div>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Atividade recente
        </h2>
        <Card>
          <CardContent className="divide-y p-0">
            {data.recent.length === 0 && (
              <p className="text-muted-foreground p-4 text-sm">{RANK_EMPTY}</p>
            )}
            {data.recent.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground mr-2 text-xs">
                    {event.type === "PAGEVIEW"
                      ? "Visita"
                      : event.type === "CLICK"
                        ? "Clique"
                        : "Evento"}
                  </span>
                  {event.name ? `${event.name} · ` : ""}
                  {event.path}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {event.device} ·{" "}
                  {format(event.createdAt, "dd/MM HH:mm:ss", { locale: ptBR })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export default AnalyticsPage
