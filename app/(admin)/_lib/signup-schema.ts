import { z } from "zod"
import { optionalImageUrlSchema } from "@/app/_lib/images"
import { barbershopProfileSchema, featuresSchema } from "./barbershop-schema"

export const PLACEHOLDER_BARBERSHOP_IMAGE = "/placeholder-barbershop.svg"

const documento = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") return true
      const digitos = value.replace(/\D/g, "")
      return digitos.length === 11 || digitos.length === 14
    },
    { message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido." },
  )

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter ao menos 8 caracteres.")
  .max(100, "A senha pode ter no máximo 100 caracteres.")

export const signupSchema = barbershopProfileSchema
  .extend({
    email: z.email("Informe um e-mail válido.").max(120),
    password: passwordSchema,
    confirmPassword: z.string(),
    ownerName: z.string().trim().min(2, "Informe o seu nome.").max(80),
    ownerPhone: z
      .string()
      .trim()
      .regex(
        /^\+?[\d\s().-]{8,20}$/,
        "Seu telefone é inválido. Use algo como (11) 99999-9999.",
      ),
    city: z.string().trim().min(2, "Informe a cidade.").max(80),
    document: documento,
    imageUrl: optionalImageUrlSchema,
    features: featuresSchema.optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  })

export type SignupInput = z.input<typeof signupSchema>

export const inviteSchema = z.object({
  email: z.email("Informe um e-mail válido.").max(120),
})

export const inviteRegistrationSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().trim().min(2, "Informe o seu nome.").max(80),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?[\d\s().-]{8,20}$/,
        "Telefone inválido. Use algo como (11) 99999-9999.",
      ),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  })
