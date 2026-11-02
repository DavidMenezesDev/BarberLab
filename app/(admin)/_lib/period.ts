import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export type EarningsPeriod = "semana" | "mes"

export const parsePeriod = (value?: string | null): EarningsPeriod =>
  value === "mes" ? "mes" : "semana"

// A semana vai de segunda a domingo.
export const getPeriodRange = (date: Date, period: EarningsPeriod) =>
  period === "mes"
    ? { from: startOfMonth(date), to: endOfMonth(date) }
    : {
        from: startOfWeek(date, { weekStartsOn: 1 }),
        to: endOfWeek(date, { weekStartsOn: 1 }),
      }

export const shiftPeriod = (
  date: Date,
  period: EarningsPeriod,
  amount: number,
) => (period === "mes" ? addMonths(date, amount) : addWeeks(date, amount))

export const formatPeriod = (date: Date, period: EarningsPeriod) => {
  const { from, to } = getPeriodRange(date, period)

  if (period === "mes") return format(from, "MMMM 'de' yyyy", { locale: ptBR })

  return `${format(from, "dd MMM", { locale: ptBR })} – ${format(to, "dd MMM", { locale: ptBR })}`
}
