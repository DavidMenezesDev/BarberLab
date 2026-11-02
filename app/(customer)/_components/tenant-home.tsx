import BookingItem from "@/app/_components/booking-item"
import Header from "@/app/_components/header"
import { getConfirmedBookings } from "@/app/_data/get-confirmed-bookings"
import type { OpeningHourSlot } from "@/app/_lib/opening-hours"
import { CalendarIcon } from "lucide-react"
import AccessNotice from "./access-notice"
import BarbershopDetail from "./barbershop-detail"

type Barbershop = React.ComponentProps<typeof BarbershopDetail>["barbershop"]

interface TenantHomeProps {
  barbershop: Barbershop
  openingHours: OpeningHourSlot[]
  erro?: string
}

// A página inicial de uma barbearia que tem o endereço só para si: o modo de
// barbearia única e os subdomínios. Sem vitrine nem links para outras barbearias.
const TenantHome = async ({
  barbershop,
  openingHours,
  erro,
}: TenantHomeProps) => {
  const confirmedBookings = await getConfirmedBookings(barbershop.id)

  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <AccessNotice error={erro} />
      <Header singleTenant />

      <BarbershopDetail
        barbershop={barbershop}
        openingHours={openingHours}
        showHeroNav={false}
        singleTenant
        sidebarSlot={
          confirmedBookings.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="text-primary h-5 w-5" />
                <h2 className="text-lg font-semibold">Seus agendamentos</h2>
              </div>
              <div className="space-y-3">
                {confirmedBookings.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </div>
            </section>
          ) : null
        }
      />
    </div>
  )
}

export default TenantHome
