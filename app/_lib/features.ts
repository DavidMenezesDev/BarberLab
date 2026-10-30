// Catálogo de funcionalidades que um plano pode liberar. Acrescentar uma chave
// aqui a deixa disponível no painel da plataforma; quem a usa chama
// requireFeature (app/_lib/entitlements.ts).
export const FEATURES = {
  appearance: {
    label: "Personalização da página",
    description: "Cores, fontes e logotipo da página pública.",
  },
  multiUnit: {
    label: "Várias unidades",
    description: "Criar e alternar entre mais de uma unidade na mesma conta.",
  },
  scheduleBlocks: {
    label: "Bloqueio de horários",
    description: "Bloquear intervalos na agenda (folga, almoço, manutenção).",
  },
  staffInvites: {
    label: "Convite de equipe",
    description: "Convidar outras pessoas para o painel da barbearia.",
  },
} as const

export type FeatureKey = keyof typeof FEATURES

export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[]

export const isFeatureKey = (value: string): value is FeatureKey =>
  value in FEATURES

export type FeatureOverrides = Partial<Record<FeatureKey, boolean>>

// Lê o JSON salvo ignorando chaves que não existem mais no catálogo.
export const parseFeatureOverrides = (value: unknown): FeatureOverrides => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, enabled]) => isFeatureKey(key) && typeof enabled === "boolean",
    ),
  )
}
