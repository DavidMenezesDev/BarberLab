import Logo from "@/app/_components/logo"
import { Button } from "@/app/_components/ui/button"
import {
  BarChart3Icon,
  CalendarCheckIcon,
  CheckIcon,
  GlobeIcon,
  PercentIcon,
  SmartphoneIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import AccessNotice from "./access-notice"

const SIGNUP_HREF = "/cadastro"

const features = [
  {
    icon: CalendarCheckIcon,
    title: "Agenda online 24h",
    description:
      "Seus clientes escolhem serviço, barbeiro e horário sozinhos, sem criar conta e sem troca de mensagens.",
  },
  {
    icon: GlobeIcon,
    title: "Página própria da barbearia",
    description:
      "Um endereço só seu, com seus serviços, preços, horários e a cara da sua marca.",
  },
  {
    icon: UsersIcon,
    title: "Equipe e unidades",
    description:
      "Cadastre barbeiros, defina horários de cada um e gerencie várias unidades em um só painel.",
  },
  {
    icon: PercentIcon,
    title: "Comissão automática",
    description:
      "Cada barbeiro acompanha os próprios ganhos e você fecha o mês sem planilha.",
  },
  {
    icon: BarChart3Icon,
    title: "Financeiro e visão geral",
    description:
      "Faturamento, atendimentos e agenda do dia em uma tela simples de entender.",
  },
  {
    icon: SmartphoneIcon,
    title: "Funciona no celular",
    description:
      "Painel pensado para o dia a dia: confirme, remarque e bloqueie horários de onde estiver.",
  },
]

const steps = [
  {
    title: "Crie sua conta",
    description: "Só e-mail e senha. Leva menos de um minuto.",
  },
  {
    title: "Configure a barbearia",
    description: "Cadastre serviços, equipe e horários de funcionamento.",
  },
  {
    title: "Compartilhe o link",
    description:
      "Seus clientes agendam direto, e você acompanha tudo no painel.",
  },
]

const trialPoints = [
  "7 dias grátis",
  "Sem cartão de crédito",
  "Cancele quando quiser",
]

const LandingHome = ({ erro }: { erro?: string }) => {
  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <AccessNotice error={erro} />

      <header className="bg-card/95 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" aria-label="Início">
            <Logo />
          </Link>

          <nav className="flex items-center gap-2 lg:gap-4">
            <a
              href="#recursos"
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors lg:block"
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors lg:block"
            >
              Como funciona
            </a>
            <Button variant="ghost" asChild>
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href={SIGNUP_HREF}>Teste 7 dias grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden px-5 py-16 text-center lg:px-8 lg:py-28">
          <div
            aria-hidden
            className="from-primary/20 via-primary/5 absolute inset-0 -z-10 bg-linear-to-b to-transparent"
          />
          <div
            aria-hidden
            className="bg-primary/20 absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          />

          <p className="bg-card/60 text-muted-foreground mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur-sm lg:text-sm">
            <span className="bg-primary size-1.5 rounded-full" />
            Sistema de agendamento para barbearias
          </p>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight lg:text-6xl lg:leading-[1.05]">
            Sua barbearia sempre{" "}
            <span className="text-primary">com a agenda cheia</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base lg:text-lg">
            Agendamento online, equipe, comissões e financeiro em um só lugar.
            Seus clientes marcam em segundos e você para de perder tempo no
            WhatsApp.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href={SIGNUP_HREF}>Teste 7 dias grátis</Link>
            </Button>
            <p className="text-muted-foreground text-xs">
              Sem cartão de crédito. Crie sua conta em menos de 1 minuto.
            </p>
          </div>
        </section>

        {/* Recursos */}
        <section
          id="recursos"
          className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-primary text-[11px] font-medium tracking-wider uppercase">
              Recursos
            </p>
            <h2 className="mt-2 text-2xl font-bold lg:text-4xl">
              Tudo que a sua barbearia precisa
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-card rounded-2xl border p-6">
                <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona */}
        <section
          id="como-funciona"
          className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-primary text-[11px] font-medium tracking-wider uppercase">
              Como funciona
            </p>
            <h2 className="mt-2 text-2xl font-bold lg:text-4xl">
              Pronto para receber agendamentos hoje
            </h2>
          </div>

          <ol className="mt-10 grid gap-4 lg:grid-cols-3 lg:gap-6">
            {steps.map((step, index) => (
              <li key={step.title} className="bg-card rounded-2xl border p-6">
                <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-5 pt-6 pb-16 lg:px-8 lg:pb-24">
          <div className="from-primary/20 via-primary/5 relative overflow-hidden rounded-3xl border bg-linear-to-br to-transparent px-5 py-12 text-center lg:py-16">
            <h2 className="mx-auto max-w-2xl text-2xl font-bold lg:text-4xl">
              Comece agora e veja sua agenda encher
            </h2>
            <ul className="text-muted-foreground mt-6 flex flex-col items-center justify-center gap-2 text-sm sm:flex-row sm:gap-6">
              {trialPoints.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckIcon className="text-primary size-4" />
                  {point}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 h-12 px-8 text-base" asChild>
              <Link href={SIGNUP_HREF}>Teste 7 dias grátis</Link>
            </Button>
            <p className="text-muted-foreground mt-4 text-xs">
              Já tem conta?{" "}
              <Link href="/entrar" className="text-primary underline">
                Entrar
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingHome
