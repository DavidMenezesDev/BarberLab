import { z } from "zod"

export const whatsappSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome.")
    .max(60, "Nome muito longo."),
  provider: z.enum(["WAHA", "UAZAPI"], { error: "Escolha o provedor." }),
  baseUrl: z
    .string()
    .trim()
    .url("Informe a URL do provedor, com http:// ou https://.")
    .refine((url) => /^https?:\/\//i.test(url), "Use http:// ou https://."),
  // Vazio ao editar mantém a chave atual.
  apiKey: z.string().trim().max(300),
  sessionName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{2,40}$/, "Use letras, números, - ou _ (2 a 40)."),
  // Vazio = número do sistema; com valor, número externo daquela barbearia.
  barbershopId: z.string().nullable(),
  isDefault: z.boolean(),
})

export type WhatsAppInput = z.infer<typeof whatsappSchema>
