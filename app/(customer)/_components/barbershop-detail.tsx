import { WEEKDAY_LABELS, type OpeningHourSlot } from "@/app/_lib/opening-hours"
import BarbershopThemeStyle from "@/app/_components/barbershop-theme-style"
import PhoneItem from "@/app/_components/phone-item"
import ServiceItem, { type BarberOption } from "@/app/_components/service-item"
import SidebarSheet from "@/app/_components/sidebar-sheet"
import { Button } from "@/app/_components/ui/button"
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet"
import {
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoIcon,
  MapPinIcon,
  MenuIcon,
  PhoneIcon,
  StarIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/app/_components/ui/badge"
import type { Barbershop, BarbershopService } from "@prisma/client"

interface BarbershopDetailProps {
  barbershop: Barbershop & {
    services: BarbershopService[]
    barbers: BarberOption[]
  }
  openingHours: OpeningHourSlot[]
  showHeroNav?: boolean
  singleTenant?: boolean
  sidebarSlot?: React.ReactNode
  otherUnitsHref?: string
}

const SectionTitle = ({
  icon: Icon,
  children,
}: {
  icon: typeof InfoIcon
  children: React.ReactNode
}) => (
  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold lg:text-xl">
    <Icon className="text-primary h-5 w-5" aria-hidden="true" />
    {children}
  </h2>
)

// Organização inspirada em páginas de vaga: barra com a marca, banner, bloco
// de título com a chamada principal e seções empilhadas em coluna única.
const BarbershopDetail = ({
  barbershop,
  openingHours,
  showHeroNav = true,
  singleTenant = false,
  sidebarSlot,
  otherUnitsHref,
}: BarbershopDetailProps) => {
  return (
    <div className="bg-background min-h-svh">
      <BarbershopThemeStyle theme={barbershop.theme} />

      {/* Barra superior com a marca */}
      <header className="bg-card/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-5 lg:h-16 lg:px-8">
          {showHeroNav && (
            <Button size="icon" variant="ghost" asChild>
              <Link href="/" aria-label="Voltar">
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
            </Button>
          )}

          {barbershop.logoUrl && (
            <Image
              alt={`Logo ${barbershop.name}`}
              src={barbershop.logoUrl}
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-lg object-contain"
            />
          )}
          <span className="min-w-0 flex-1 truncate font-semibold">
            {barbershop.name}
          </span>

          <nav className="text-muted-foreground hidden items-center gap-6 text-sm lg:flex">
            <a href="#sobre" className="hover:text-foreground">
              Sobre
            </a>
            <a href="#servicos" className="hover:text-foreground">
              Serviços
            </a>
            <a href="#horarios" className="hover:text-foreground">
              Horários
            </a>
            <a href="#contato" className="hover:text-foreground">
              Contato
            </a>
          </nav>

          {showHeroNav && (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Menu">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SidebarSheet singleTenant={singleTenant} />
            </Sheet>
          )}
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-40 w-full lg:h-72">
        <Image
          alt={barbershop.name}
          src={barbershop.imageUrl}
          fill
          sizes="100vw"
          quality={75}
          className="object-cover"
          priority={true}
        />
      </div>

      <main className="mx-auto max-w-4xl px-5 lg:px-8">
        {/* Título e chamada principal */}
        <section className="space-y-4 py-6 lg:py-10">
          <h1 className="text-2xl font-bold lg:text-4xl">{barbershop.name}</h1>

          <div className="text-muted-foreground flex items-center gap-2">
            <MapPinIcon size={16} className="shrink-0" />
            <p className="text-sm lg:text-base">{barbershop.address}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/90">
              <StarIcon size={12} className="mr-1 fill-current" />
              {4.9}
            </Badge>
            <Badge variant="secondary">{70} avaliações</Badge>
            <Badge variant="secondary">
              {barbershop.services.length} serviços
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button size="lg" asChild>
              <a href="#servicos">
                <CalendarIcon aria-hidden="true" />
                Agendar horário
              </a>
            </Button>
            {otherUnitsHref && (
              <Link
                href={otherUnitsHref}
                className="text-muted-foreground text-sm underline underline-offset-4"
              >
                Trocar de unidade
              </Link>
            )}
          </div>
        </section>

        {/* Seções empilhadas */}
        <div className="[&>*]:border-border divide-y *:py-8 lg:*:py-10">
          <section id="sobre" className="scroll-mt-20 border-t">
            <SectionTitle icon={InfoIcon}>Sobre a barbearia</SectionTitle>
            <p className="text-muted-foreground leading-relaxed lg:text-lg">
              {barbershop.description}
            </p>

            {barbershop.features.length > 0 && (
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {barbershop.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircleIcon className="text-primary h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sidebarSlot && <section>{sidebarSlot}</section>}

          <section id="servicos" className="scroll-mt-20">
            <SectionTitle icon={CalendarIcon}>Nossos serviços</SectionTitle>
            <div className="grid gap-4">
              {barbershop.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  barbershop={JSON.parse(JSON.stringify(barbershop))}
                  service={JSON.parse(JSON.stringify(service))}
                  barbers={barbershop.barbers}
                />
              ))}
            </div>
          </section>

          <section id="horarios" className="scroll-mt-20">
            <SectionTitle icon={ClockIcon}>
              Horário de funcionamento
            </SectionTitle>
            <div className="max-w-md">
              {openingHours.map((hour) => (
                <div
                  key={hour.weekday}
                  className="border-border/50 flex items-center justify-between border-b py-2 last:border-0"
                >
                  <span className="text-sm font-medium">
                    {WEEKDAY_LABELS[hour.weekday]}
                  </span>
                  <span
                    className={`text-sm ${hour.isClosed ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {hour.isClosed
                      ? "Fechado"
                      : `${hour.opensAt} - ${hour.closesAt}`}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="contato" className="scroll-mt-20">
            <SectionTitle icon={PhoneIcon}>Contato</SectionTitle>
            <div className="space-y-4">
              {barbershop.phones.map((phone) => (
                <PhoneItem key={phone} phone={phone} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default BarbershopDetail
