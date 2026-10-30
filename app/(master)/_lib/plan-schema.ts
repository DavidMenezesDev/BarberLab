import { FEATURE_KEYS } from "@/app/_lib/features"
import { z } from "zod"

const limit = z
  .number()
  .int("Use um número inteiro.")
  .min(1, "Mínimo 1.")
  .nullable()

export const planSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome.")
    .max(40, "Nome muito longo."),
  description: z.string().trim().max(200, "Descrição muito longa."),
  priceMonthly: z.number().min(0, "O preço não pode ser negativo.").max(100000),
  priceYearly: z
    .number()
    .min(0, "O preço não pode ser negativo.")
    .max(1000000)
    .nullable(),
  maxUnits: limit,
  maxBarbers: limit,
  features: z.array(z.enum(FEATURE_KEYS as [string, ...string[]])),
  isActive: z.boolean(),
  isDefault: z.boolean(),
})

export type PlanInput = z.infer<typeof planSchema>
