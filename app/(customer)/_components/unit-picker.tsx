import Header from "@/app/_components/header"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { MapPinIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface UnitPickerProps {
  name: string
  units: {
    id: string
    name: string
    slug: string
    address: string
    city: string | null
    imageUrl: string
  }[]
}

const UnitPicker = ({ name, units }: UnitPickerProps) => {
  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <Header />

      <div className="mx-auto max-w-3xl px-5 py-8 lg:py-14">
        <header className="space-y-2 pb-6">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {name}
          </p>
          <h1 className="text-2xl font-bold lg:text-3xl">Escolha a unidade</h1>
          <p className="text-muted-foreground text-sm">
            Selecione onde você quer ser atendido para ver serviços, barbeiros e
            horários.
          </p>
        </header>

        <ul className="space-y-3">
          {units.map((unit) => (
            <li key={unit.id}>
              <Card>
                <CardContent className="flex items-center gap-4 p-3 lg:p-4">
                  <div className="relative h-20 w-20 shrink-0 lg:h-24 lg:w-24">
                    <Image
                      alt={unit.name}
                      src={unit.imageUrl}
                      fill
                      sizes="96px"
                      className="rounded-xl object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="truncate font-semibold">{unit.name}</h2>
                    <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
                      <MapPinIcon size={14} className="mt-0.5 shrink-0" />
                      <span>
                        {unit.address}
                        {unit.city ? ` · ${unit.city}` : ""}
                      </span>
                    </p>
                  </div>

                  <Button asChild className="shrink-0">
                    <Link href={`/${unit.slug}`}>Agendar</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default UnitPicker
