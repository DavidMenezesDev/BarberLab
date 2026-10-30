"use client"

import { Card, CardContent } from "@/app/_components/ui/card"
import { Badge } from "@/app/_components/ui/badge"
import { Select } from "@/app/_components/ui/select"
import { Switch } from "@/app/_components/ui/switch"
import {
  FEATURES,
  FEATURE_KEYS,
  type FeatureOverrides,
} from "@/app/_lib/features"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  assignPlan,
  setBarbershopSuspended,
  setFeatureOverride,
} from "../_actions/barbershops"

interface PlanOption {
  id: string
  name: string
  isActive: boolean
  features: string[]
}

interface BarbershopControlsProps {
  barbershopId: string
  planId: string | null
  suspended: boolean
  plans: PlanOption[]
  overrides: FeatureOverrides
}

const BarbershopControls = ({
  barbershopId,
  planId,
  suspended,
  plans,
  overrides,
}: BarbershopControlsProps) => {
  const [isPending, startTransition] = useTransition()
  const plan = plans.find((item) => item.id === planId)

  const run = (
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    success: string,
  ) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(success)
      else toast.error(result.error)
    })

  const handleOverride = (feature: string, value: string) =>
    run(
      () =>
        setFeatureOverride(
          barbershopId,
          feature,
          value === "inherit" ? null : value === "on",
        ),
      "Funcionalidade atualizada.",
    )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Plano e status
        </h2>
        <Card>
          <CardContent className="space-y-5 p-4">
            <div className="space-y-1.5">
              <label htmlFor="plan" className="text-sm font-medium">
                Plano
              </label>
              <Select
                id="plan"
                value={planId ?? ""}
                disabled={isPending}
                onChange={(event) =>
                  run(
                    () => assignPlan(barbershopId, event.target.value || null),
                    "Plano atualizado.",
                  )
                }
              >
                <option value="">Sem plano (acesso total)</option>
                {plans.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={!item.isActive && item.id !== planId}
                  >
                    {item.name}
                    {!item.isActive && " (inativo)"}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Barbearia suspensa</p>
                <p className="text-muted-foreground text-xs">
                  Some do catálogo, não recebe agendamentos e o painel fica
                  bloqueado.
                </p>
              </div>
              <Switch
                checked={suspended}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  run(
                    () => setBarbershopSuspended(barbershopId, checked),
                    checked ? "Barbearia suspensa." : "Barbearia reativada.",
                  )
                }
                aria-label="Suspender barbearia"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          Funcionalidades
        </h2>
        <Card>
          <CardContent className="divide-y p-0">
            {FEATURE_KEYS.map((key) => {
              const fromPlan = plan ? plan.features.includes(key) : true
              const override = overrides[key]
              const effective = override ?? fromPlan
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {FEATURES[key].label}
                      </p>
                      <Badge variant={effective ? "default" : "outline"}>
                        {effective ? "Liberada" : "Bloqueada"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Plano: {fromPlan ? "inclui" : "não inclui"}
                    </p>
                  </div>
                  <Select
                    aria-label={FEATURES[key].label}
                    className="w-36 shrink-0"
                    disabled={isPending}
                    value={
                      override === undefined
                        ? "inherit"
                        : override
                          ? "on"
                          : "off"
                    }
                    onChange={(event) =>
                      handleOverride(key, event.target.value)
                    }
                  >
                    <option value="inherit">Seguir plano</option>
                    <option value="on">Sempre liberada</option>
                    <option value="off">Sempre bloqueada</option>
                  </Select>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default BarbershopControls
