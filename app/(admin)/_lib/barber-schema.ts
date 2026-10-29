import { z } from "zod"
import { optionalImageUrlSchema } from "@/app/_lib/images"

export const barberSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome do barbeiro.").max(60),
  specialty: z.string().trim().max(80, "Máximo de 80 caracteres."),
  imageUrl: optionalImageUrlSchema,
  isActive: z.boolean(),
})

export type BarberInput = z.infer<typeof barberSchema>
