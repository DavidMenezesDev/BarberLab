import { z } from "zod"
import { optionalImageUrlSchema } from "@/app/_lib/images"
import { barbershopThemeSchema } from "@/app/_lib/theme"

export const appearanceSchema = z.object({
  // null devolve a página ao visual padrão do Barber Lab.
  theme: barbershopThemeSchema.nullable(),
  logoUrl: optionalImageUrlSchema,
})

export type AppearanceInput = z.input<typeof appearanceSchema>
