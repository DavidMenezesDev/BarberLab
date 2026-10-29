import Header from "@/app/_components/header"
import { Button } from "@/app/_components/ui/button"
import Image from "next/image"
import { db } from "@/app/_lib/prisma"
import BarbershopItem from "@/app/_components/barbershop-item"
import { quickSearchOptions } from "@/app/_constants/search"
import BookingItem from "@/app/_components/booking-item"
import Search from "@/app/_components/search"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConfirmedBookings } from "@/app/_data/get-confirmed-bookings"
import {
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  TrendingUpIcon,
} from "lucide-react"
import AccessNotice from "./access-notice"

interface CatalogHomeProps {
  erro?: string
}

const CatalogHome = async ({ erro }: CatalogHomeProps) => {
  const session = await getServerSession(authOptions)
  const [barbershops, confirmedBookings] = await Promise.all([
    db.barbershop.findMany({ orderBy: { name: "asc" } }),
    getConfirmedBookings(),
  ])
  const popularBarbershops = [...barbershops].reverse()

  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <AccessNotice error={erro} />

      {/* cabeçalho */}
      <Header />

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-7xl">
        <div className="p-5 lg:px-8 lg:py-12">
          {/* Hero */}
          <section className="relative isolate overflow-hidden rounded-3xl border px-5 py-10 text-center lg:px-12 lg:py-20">
            <div
              aria-hidden
              className="from-primary/20 via-primary/5 absolute inset-0 -z-10 bg-linear-to-b to-transparent"
            />
            <div
              aria-hidden
              className="bg-primary/20 absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
            />

            <div className="bg-card/60 text-muted-foreground mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur-sm lg:text-sm">
              <CalendarIcon className="text-primary h-3.5 w-3.5" />
              <span className="first-letter:uppercase">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight lg:text-6xl lg:leading-[1.05]">
              {session?.user ? (
                <>
                  Olá, <span className="text-primary">{session.user.name}</span>
                  !
                </>
              ) : (
                <>
                  Seu próximo corte,{" "}
                  <span className="text-primary">a um toque</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm lg:text-lg">
              Encontre a barbearia ideal, escolha o serviço e agende o horário
              em segundos.
            </p>

            <div className="bg-card/70 mx-auto mt-8 max-w-2xl rounded-2xl border p-2 shadow-lg backdrop-blur-sm">
              <Search />
            </div>

            <div className="mt-6 flex [scrollbar-width:none] justify-start gap-2 overflow-x-auto lg:flex-wrap lg:justify-center lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {quickSearchOptions.map((option) => (
                <Button
                  className="shrink-0 gap-2 rounded-full transition-transform hover:scale-105"
                  variant="secondary"
                  key={option.title}
                  asChild
                >
                  <Link href={`/barbershops?service=${option.title}`}>
                    <Image
                      src={option.imageUrl}
                      width={16}
                      height={16}
                      alt=""
                    />
                    {option.title}
                  </Link>
                </Button>
              ))}
            </div>

            {barbershops.length > 0 && (
              <p className="text-muted-foreground mt-6 flex items-center justify-center gap-2 text-sm">
                <MapPinIcon className="text-primary h-4 w-4" />
                {barbershops.length}{" "}
                {barbershops.length === 1
                  ? "barbearia disponível"
                  : "barbearias disponíveis"}
              </p>
            )}
          </section>

          {/* Seção de agendamentos */}
          {confirmedBookings.length > 0 && (
            <div className="mt-12 lg:mt-20">
              <div className="mb-6 flex items-center gap-3 lg:mb-8">
                <CalendarIcon className="text-primary h-5 w-5 lg:h-6 lg:w-6" />
                <h2 className="lg:text-foreground text-xs font-bold text-gray-400 uppercase lg:text-lg lg:font-semibold lg:normal-case">
                  Seus Agendamentos
                </h2>
              </div>

              <div className="flex [scrollbar-width:none] gap-3 overflow-x-auto lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible xl:grid-cols-3 [&::-webkit-scrollbar]:hidden">
                {confirmedBookings.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </div>
            </div>
          )}

          {/* Seção recomendados */}
          <div id="recomendados" className="mt-12 lg:mt-20">
            <div className="mb-6 flex items-center justify-between lg:mb-8">
              <div className="flex items-center gap-3">
                <StarIcon className="text-primary h-5 w-5 lg:h-6 lg:w-6" />
                <h2 className="lg:text-foreground text-xs font-bold text-gray-400 uppercase lg:text-lg lg:font-semibold lg:normal-case">
                  Recomendados para você
                </h2>
              </div>
              <Button variant="ghost" className="hidden lg:flex" asChild>
                <Link href="/barbershops?tag=recomendados">Ver todos</Link>
              </Button>
            </div>

            <div className="flex [scrollbar-width:none] gap-4 overflow-auto lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible xl:grid-cols-4 2xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
              {barbershops.slice(0, 5).map((barbershop) => (
                <BarbershopItem key={barbershop.id} barbershop={barbershop} />
              ))}
            </div>
          </div>

          {/* Seção populares */}
          <div className="mt-12 lg:mt-20 lg:mb-12">
            <div className="mb-6 flex items-center justify-between lg:mb-8">
              <div className="flex items-center gap-3">
                <TrendingUpIcon className="text-primary h-5 w-5 lg:h-6 lg:w-6" />
                <h2 className="lg:text-foreground text-xs font-bold text-gray-400 uppercase lg:text-lg lg:font-semibold lg:normal-case">
                  Mais populares
                </h2>
              </div>
              <Button variant="ghost" className="hidden lg:flex" asChild>
                <Link href="/barbershops?tag=popular">Ver todos</Link>
              </Button>
            </div>

            <div className="flex [scrollbar-width:none] gap-4 overflow-auto lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible xl:grid-cols-4 2xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
              {popularBarbershops.slice(0, 10).map((barbershop) => (
                <BarbershopItem key={barbershop.id} barbershop={barbershop} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CatalogHome
