import { z } from "zod"
import { optionalImageUrlSchema } from "@/app/_lib/images"
import { barbershopProfileSchema } from "./barbershop-schema"

export const MAX_UNITS_PER_USER = 10

// Mesmos campos do cadastro da barbearia, sem os dados de acesso: quem cria
// uma nova unidade já tem conta.
export const newUnitSchema = barbershopProfileSchema
  .pick({ name: true, address: true, description: true })
  .extend({
    city: z.string().trim().min(2, "Informe a cidade.").max(80),
    phone: barbershopProfileSchema.shape.phones.element,
    imageUrl: optionalImageUrlSchema,
  })

export type NewUnitInput = z.input<typeof newUnitSchema>
