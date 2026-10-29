"use client"

import { Barbershop, BarbershopService } from "@prisma/client"
import Image from "next/image"
import { ChevronLeftIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useState, useTransition } from "react"
import { addMinutes, isPast, set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { getSavedCustomer } from "../_actions/customer"
import { toast } from "sonner"
import {
  getServiceOpeningHours,
  getUnavailableIntervals,
  type UnavailableInterval,
} from "../_actions/get-bookings"
import {
  buildDaySlots,
  findDayHours,
  isClosedOn,
  type OpeningHourSlot,
} from "../_lib/opening-hours"
import CustomerFields from "./customer-fields"
import BookingSummary from "./booking-summary"
import {
  buildCustomerConfirmationMessage,
  buildWhatsAppUrl,
} from "../_lib/whatsapp"

export interface BarberOption {
  id: string
  name: string
  specialty: string | null
  imageUrl: string | null
}

interface ServiceItemProps {
  service: BarbershopService
  barbershop: Pick<Barbershop, "name" | "phones">
  barbers?: BarberOption[]
}

interface GetTimeListProps {
  intervals: UnavailableInterval[]
  selectedDay: Date
  durationMinutes: number
  openingHours: OpeningHourSlot[]
}

type BookingStep = "barber" | "date" | "time" | "details"

const STEP_TITLES: Record<BookingStep, string> = {
  barber: "Escolha o barbeiro",
  date: "Escolha o dia",
  time: "Escolha o horário",
  details: "Confirme sua reserva",
}

const getTimeList = ({
  intervals,
  selectedDay,
  durationMinutes,
  openingHours,
}: GetTimeListProps) => {
  const doDia = findDayHours(openingHours, selectedDay)

  return buildDaySlots(doDia, durationMinutes).filter((time) => {
    const [hours, minutes] = time.split(":").map(Number)
    const startsAt = set(selectedDay, {
      hours,
      minutes,
      seconds: 0,
      milliseconds: 0,
    })

    if (isPast(startsAt)) return false

    const endsAt = addMinutes(startsAt, durationMinutes)

    return !intervals.some(
      (interval) =>
        startsAt < new Date(interval.endsAt) &&
        endsAt > new Date(interval.startsAt),
    )
  })
}

const ServiceItem = ({
  service,
  barbershop,
  barbers = [],
}: ServiceItemProps) => {
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
  })
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(
    undefined,
  )
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [unavailable, setUnavailable] = useState<UnavailableInterval[]>([])
  const [openingHours, setOpeningHours] = useState<OpeningHourSlot[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isCreating, startCreating] = useTransition()

  const needsBarber = barbers.length > 0
  const selectedBarber = barbers.find(
    (barber) => barber.id === selectedBarberId,
  )
  const barberStepDone = !needsBarber || !!selectedBarber
  const firstStep: BookingStep = needsBarber ? "barber" : "date"
  const [step, setStep] = useState<BookingStep>(firstStep)
  const canGoBack = step !== firstStep

  useEffect(() => {
    if (!selectedDay || !barberStepDone) return

    let current = true
    setIsLoadingSlots(true)

    const load = async () => {
      const [intervals, hours] = await Promise.all([
        getUnavailableIntervals({
          date: selectedDay,
          serviceId: service.id,
          barberId: selectedBarberId,
        }),
        getServiceOpeningHours(service.id),
      ])
      if (!current) return
      setUnavailable(intervals)
      setOpeningHours(hours)
      setIsLoadingSlots(false)
    }

    load()
    return () => {
      current = false
    }
  }, [selectedDay, service.id, selectedBarberId, barberStepDone])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return
    return set(selectedDay, {
      hours: Number(selectedTime?.split(":")[0]),
      minutes: Number(selectedTime?.split(":")[1]),
    })
  }, [selectedDay, selectedTime])

  const handleBookingClick = () => {
    setBookingSheetIsOpen(true)
    getSavedCustomer().then((saved) => {
      if (saved) setCustomer(saved)
    })
  }

  const handleBarberSelect = (barberId: string | undefined) => {
    setSelectedBarberId(barberId)
    setSelectedTime(undefined)
    setUnavailable([])
    if (barberId) setStep("date")
  }

  const handleBack = () => {
    if (step === "details") setStep("time")
    else if (step === "time") setStep("date")
    else if (step === "date") {
      handleBarberSelect(undefined)
      setStep("barber")
    }
  }

  const handleBookingSheetOpenChange = () => {
    setSelectedBarberId(undefined)
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setUnavailable([])
    setOpeningHours([])
    setIsLoadingSlots(false)
    setStep(firstStep)
    setBookingSheetIsOpen(false)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
    setSelectedTime(undefined)
    if (date) setStep("time")
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep("details")
  }

  const handleCreateBooking = () =>
    startCreating(async () => {
      try {
        if (!selectedDate) return
        const result = await createBooking({
          serviceId: service.id,
          barberId: selectedBarberId,
          date: selectedDate,
          customer,
        })

        if (!result.ok) {
          toast.error(result.error)
          return
        }

        handleBookingSheetOpenChange()

        const whatsappUrl = buildWhatsAppUrl({
          phone: barbershop.phones?.[0],
          message: buildCustomerConfirmationMessage({
            serviceName: service.name,
            date: selectedDate,
            barbershopName: barbershop.name,
            customerName: customer.name.trim(),
            price: Number(service.price),
          }),
        })

        toast.success("Reserva criada com sucesso!", {
          description: "Confirme com a barbearia pelo WhatsApp.",
          duration: 10000,
          action: {
            label: "Confirmar",
            onClick: () => window.open(whatsappUrl, "_blank"),
          },
        })
      } catch (error) {
        console.error(error)
        toast.error("Erro ao criar reserva!")
      }
    })

  const timeList = useMemo(() => {
    if (!selectedDay) return []
    return getTimeList({
      intervals: unavailable,
      selectedDay,
      durationMinutes: service.durationMinutes,
      openingHours,
    })
  }, [unavailable, selectedDay, service.durationMinutes, openingHours])

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          {/* IMAGE */}
          <div className="relative max-h-[110px] min-h-[110px] max-w-[110px] min-w-[110px]">
            <Image
              alt={service.name || "Serviço"}
              src={service.imageUrl}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="rounded-lg object-cover"
            />
          </div>
          {/* DIREITA */}
          <div className="flex flex-1 flex-col space-y-2">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>
            {/* PREÇO E BOTÃO */}
            <div className="flex items-center justify-between">
              <p className="text-primary text-sm font-bold">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>
              <div className="flex-1" />
              <Dialog
                open={bookingSheetIsOpen}
                onOpenChange={(open) => {
                  if (!open) handleBookingSheetOpenChange()
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBookingClick}
                  className="ml-auto px-4 py-2 text-xs sm:text-sm md:text-base lg:px-6 lg:py-3"
                >
                  Reservar
                </Button>

                <DialogContent
                  className="flex max-h-[90dvh] w-[92%] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-md"
                  aria-describedby={undefined}
                >
                  <DialogHeader className="relative items-center border-b border-solid px-12 py-4 text-center sm:text-center">
                    {canGoBack && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isCreating}
                        className="absolute top-2 left-2 h-8 w-8"
                        aria-label="Voltar"
                      >
                        <ChevronLeftIcon size={18} />
                      </Button>
                    )}
                    <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
                  </DialogHeader>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {step === "barber" && (
                      <div className="space-y-3 px-5 py-5">
                        <div className="space-y-2">
                          {barbers.map((barber) => (
                            <button
                              key={barber.id}
                              type="button"
                              onClick={() => handleBarberSelect(barber.id)}
                              className="hover:bg-secondary/60 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                            >
                              <Avatar className="h-12 w-12">
                                {barber.imageUrl && (
                                  <AvatarImage
                                    src={barber.imageUrl}
                                    alt={barber.name}
                                  />
                                )}
                                <AvatarFallback>
                                  {barber.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">
                                  {barber.name}
                                </p>
                                {barber.specialty && (
                                  <p className="text-muted-foreground truncate text-xs">
                                    {barber.specialty}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === "date" && (
                      <div className="px-5 py-5">
                        <Calendar
                          mode="single"
                          locale={ptBR}
                          selected={selectedDay}
                          onSelect={handleDateSelect}
                          disabled={(date: Date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          className="w-full"
                          styles={{
                            root: {
                              width: "100%",
                            },
                            table: {
                              width: "100%",
                            },
                            head_cell: {
                              width: "100%",
                              textTransform: "capitalize",
                            },
                            cell: {
                              width: "100%",
                            },
                            button: {
                              width: "100%",
                            },
                            nav_button_previous: {
                              width: "32px",
                              height: "32px",
                            },
                            nav_button_next: {
                              width: "32px",
                              height: "32px",
                            },
                            caption: {
                              textTransform: "capitalize",
                            },
                          }}
                        />
                      </div>
                    )}

                    {step === "time" && selectedDay && (
                      <div className="p-5">
                        {isLoadingSlots ? (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <div
                                key={i}
                                className="bg-muted/60 h-8 animate-pulse rounded-md"
                              />
                            ))}
                          </div>
                        ) : timeList.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {timeList.map((time) => (
                              <Button
                                key={time}
                                size="sm"
                                variant={
                                  selectedTime === time ? "default" : "outline"
                                }
                                onClick={() => handleTimeSelect(time)}
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            {isClosedOn(openingHours, selectedDay)
                              ? "A barbearia não atende nesse dia."
                              : "Os horários desse dia já foram preenchidos."}
                          </p>
                        )}
                      </div>
                    )}

                    {step === "details" && selectedDate && (
                      <div className="space-y-5 p-5">
                        <BookingSummary
                          barbershop={barbershop}
                          service={service}
                          selectedDate={selectedDate}
                          barberName={selectedBarber?.name}
                        />
                        <div className="border-t border-solid pt-5">
                          <h3 className="mb-3 text-sm font-semibold">
                            Seus dados
                          </h3>
                          <CustomerFields
                            idPrefix={`reserva-${service.id}`}
                            value={customer}
                            onChange={setCustomer}
                            disabled={isCreating}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {step === "details" && (
                    <DialogFooter className="border-t border-solid px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                      <Button
                        className="w-full"
                        onClick={handleCreateBooking}
                        disabled={
                          !selectedDay ||
                          !selectedTime ||
                          !customer.name.trim() ||
                          !customer.phone.trim() ||
                          isCreating
                        }
                      >
                        {isCreating ? "Confirmando..." : "Confirmar"}
                      </Button>
                    </DialogFooter>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default ServiceItem
