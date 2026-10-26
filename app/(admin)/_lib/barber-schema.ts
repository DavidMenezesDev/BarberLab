import { z } from "zod"

export const barberSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome do barbeiro.").max(60),
  specialty: z.string().trim().max(80, "Máximo de 80 caracteres."),
  imageUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || z.url().safeParse(value).success, {
      message: "Informe uma URL de imagem válida.",
    }),
  isActive: z.boolean(),
})

export type BarberInput = z.infer<typeof barberSchema>
