import { headers } from "next/headers"

// Preenchido pelo proxy.ts quando a requisição chega por um subdomínio de
// barbearia. O proxy sempre sobrescreve, então o valor não vem do cliente.
export const TENANT_HEADER = "x-tenant-slug"

export const getTenantSlug = async () =>
  (await headers()).get(TENANT_HEADER) || null
