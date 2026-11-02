import { Button } from "@/app/_components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { toDateParam } from "../_lib/format"
import { formatPeriod, shiftPeriod, type EarningsPeriod } from "../_lib/period"

interface PeriodNavigatorProps {
  basePath: string
  date: Date
  period: EarningsPeriod
  // Só o painel do dono alterna entre semana e mês.
  allowMonth?: boolean
}

const PeriodNavigator = ({
  basePath,
  date,
  period,
  allowMonth = false,
}: PeriodNavigatorProps) => {
  const href = (target: Date, targetPeriod = period) =>
    `${basePath}?date=${toDateParam(target)}&periodo=${targetPeriod}`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link
          href={href(shiftPeriod(date, period, -1))}
          aria-label="Período anterior"
        >
          <ChevronLeftIcon />
        </Link>
      </Button>

      <div className="bg-card/50 min-w-[170px] flex-1 rounded-lg border px-4 py-2 text-center sm:flex-none">
        <p className="text-sm font-semibold first-letter:uppercase">
          {formatPeriod(date, period)}
        </p>
      </div>

      <Button variant="outline" size="icon" asChild>
        <Link
          href={href(shiftPeriod(date, period, 1))}
          aria-label="Próximo período"
        >
          <ChevronRightIcon />
        </Link>
      </Button>

      {allowMonth && (
        <>
          <Button
            variant={period === "semana" ? "default" : "secondary"}
            asChild
          >
            <Link href={href(date, "semana")}>Semana</Link>
          </Button>
          <Button variant={period === "mes" ? "default" : "secondary"} asChild>
            <Link href={href(date, "mes")}>Mês</Link>
          </Button>
        </>
      )}
    </div>
  )
}

export default PeriodNavigator
