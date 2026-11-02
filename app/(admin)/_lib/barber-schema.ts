import { z } from "zod"
import { optionalImageUrlSchema } from "@/app/_lib/images"

export const barberSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome do barbeiro.").max(60),
  specialty: z.string().trim().max(80, "Máximo de 80 caracteres."),
  imageUrl: optionalImageUrlSchema,
  commissionPercent: z
    .number("Informe a porcentagem.")
    .min(0, "A porcentagem mínima é 0.")
    .max(100, "A porcentagem máxima é 100."),
  isActive: z.boolean(),
})

export type BarberInput = z.infer<typeof barberSchema>
