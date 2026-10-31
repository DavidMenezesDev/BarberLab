import { z } from "zod"

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Nome muito longo."),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[\d\s().-]{8,20}$/,
      "Telefone inválido. Use algo como (11) 99999-9999.",
    ),
  email: z
    .string()
    .trim()
    .max(120, "E-mail muito longo.")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "E-mail inválido.",
    })
    .optional()
    .default(""),
  birthDate: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (DATA_ISO.test(value) &&
          !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) &&
          new Date(`${value}T00:00:00Z`) <= new Date() &&
          value >= "1900-01-01"),
      { message: "Data de aniversário inválida." },
    )
    .optional()
    .default(""),
})

export type CustomerInput = z.input<typeof customerSchema>

export interface SavedCustomer {
  name: string
  phone: string
  email: string
  birthDate: string
}

// Celulares brasileiros: remove o nono dígito extra (79988426718 -> 7988426718).
export const removeExtraNine = (phone: string) => {
  const digits = phone.replace(/\D/g, "")

  if (digits.length === 11 && digits[2] === "9") {
    return digits.slice(0, 2) + digits.slice(3)
  }

  return phone
}

export const toCustomerData = (data: z.output<typeof customerSchema>) => ({
  name: data.name,
  phone: removeExtraNine(data.phone),
  email: data.email || null,
  birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00Z`) : null,
})
