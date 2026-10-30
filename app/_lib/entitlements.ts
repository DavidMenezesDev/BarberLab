import { cache } from "react"
import {
  FEATURE_KEYS,
  parseFeatureOverrides,
  type FeatureKey,
  type FeatureOverrides,
} from "./features"
import { db } from "./prisma"

export interface Entitlements {
  planName: string | null
  features: Record<FeatureKey, boolean>
  maxUnits: number | null
  maxBarbers: number | null
  suspended: boolean
}

interface PlanInput {
  features: string[]
  maxUnits: number | null
  maxBarbers: number | null
}

// Plano + exceções da barbearia. Sem plano não há restrição; a exceção
// individual sempre vence o plano.
export const resolveEntitlements = (input: {
  plan: (PlanInput & { name: string }) | null
  overrides: FeatureOverrides
  suspended: boolean
}): Entitlements => {
  const { plan, overrides, suspended } = input

  const features = Object.fromEntries(
    FEATURE_KEYS.map((key) => [
      key,
      overrides[key] ?? (plan ? plan.features.includes(key) : true),
    ]),
  ) as Record<FeatureKey, boolean>

  return {
    planName: plan?.name ?? null,
    features,
    maxUnits: plan?.maxUnits ?? null,
    maxBarbers: plan?.maxBarbers ?? null,
    suspended,
  }
}

export const getEntitlements = cache(
  async (barbershopId: string): Promise<Entitlements | null> => {
    const barbershop = await db.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        suspendedAt: true,
        featureOverrides: true,
        plan: {
          select: {
            name: true,
            features: true,
            maxUnits: true,
            maxBarbers: true,
          },
        },
      },
    })
    if (!barbershop) return null

    return resolveEntitlements({
      plan: barbershop.plan,
      overrides: parseFeatureOverrides(barbershop.featureOverrides),
      suspended: barbershop.suspendedAt !== null,
    })
  },
)

const FEATURE_DENIED = "Esta funcionalidade não está disponível no seu plano."

// Para server actions: nulo quando liberada, senão a resposta de erro pronta.
export const featureError = async (
  barbershopId: string,
  feature: FeatureKey,
) => {
  const entitlements = await getEntitlements(barbershopId)

  if (!entitlements || entitlements.suspended) {
    return { ok: false as const, error: "Barbearia indisponível." }
  }
  if (!entitlements.features[feature]) {
    return { ok: false as const, error: FEATURE_DENIED }
  }
  return null
}
