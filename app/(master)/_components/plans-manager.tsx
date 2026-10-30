"use client"

import { formatCurrency } from "@/app/(admin)/_lib/format"
import { Badge } from "@/app/_components/ui/badge"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog"
import { Input } from "@/app/_components/ui/input"
import { Label } from "@/app/_components/ui/label"
import { Switch } from "@/app/_components/ui/switch"
import { Textarea } from "@/app/_components/ui/textarea"
import { FEATURES, FEATURE_KEYS } from "@/app/_lib/features"
import { cn } from "@/app/_lib/utils"
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { deletePlan, setPlanActive, upsertPlan } from "../_actions/plans"
import type { MasterPlan } from "../_data/get-metrics"

interface FormState {
  id?: string
  name: string
  description: string
  priceMonthly: string
  priceYearly: string
  maxUnits: string
  maxBarbers: string
  features: string[]
  isActive: boolean
  isDefault: boolean
}

const EMPTY: FormState = {
  name: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "",
  maxUnits: "",
  maxBarbers: "",
  features: [],
  isActive: true,
  isDefault: false,
}

const toForm = (plan: MasterPlan): FormState => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  priceMonthly: String(plan.priceMonthly),
  priceYearly: plan.priceYearly === null ? "" : String(plan.priceYearly),
  maxUnits: plan.maxUnits === null ? "" : String(plan.maxUnits),
  maxBarbers: plan.maxBarbers === null ? "" : String(plan.maxBarbers),
  features: plan.features,
  isActive: plan.isActive,
  isDefault: plan.isDefault,
})

// Campo vazio é "sem limite"; texto que não é número vira NaN e o servidor recusa.
const parseOptional = (value: string) =>
  value.trim() === "" ? null : Number(value.replace(",", "."))

const limitLabel = (value: number | null, unit: string) =>
  value === null ? `${unit} ilimitadas` : `${value} ${unit}`

const PlansManager = ({ plans }: { plans: MasterPlan[] }) => {
  const [form, setForm] = useState<FormState | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<MasterPlan | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const patch = (changes: Partial<FormState>) =>
    setForm((current) => (current ? { ...current, ...changes } : current))

  const toggleFeature = (key: string, enabled: boolean) =>
    patch({
      features: enabled
        ? [...(form?.features ?? []), key]
        : (form?.features ?? []).filter((item) => item !== key),
    })

  const save = () => {
    if (!form) return
    startTransition(async () => {
      const result = await upsertPlan({
        id: form.id,
        name: form.name,
        description: form.description,
        priceMonthly: Number(form.priceMonthly.replace(",", ".")),
        priceYearly: parseOptional(form.priceYearly),
        maxUnits: parseOptional(form.maxUnits),
        maxBarbers: parseOptional(form.maxBarbers),
        features: form.features,
        isActive: form.isActive,
        isDefault: form.isDefault,
      })
      if (result.ok) {
        toast.success("Plano salvo.")
        setForm(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const toggleActive = (plan: MasterPlan, isActive: boolean) =>
    startTransition(async () => {
      const result = await setPlanActive(plan.id, isActive)
      if (result.ok)
        toast.success(isActive ? "Plano ativado." : "Plano desativado.")
      else toast.error(result.error)
    })

  const remove = () => {
    if (!pendingDeletion) return
    const target = pendingDeletion
    startTransition(async () => {
      const result = await deletePlan(target.id)
      if (result.ok) {
        toast.success("Plano excluído.")
        setPendingDeletion(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          {plans.length} {plans.length === 1 ? "plano" : "planos"}
        </h2>
        <Button onClick={() => setForm(EMPTY)}>
          <PlusIcon />
          Novo plano
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "transition-opacity",
              !plan.isActive && "opacity-60",
              isPending && "pointer-events-none",
            )}
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.isDefault && <Badge>Padrão</Badge>}
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {plan.description || "Sem descrição."}
                  </p>
                </div>
                <Switch
                  checked={plan.isActive}
                  onCheckedChange={(checked) => toggleActive(plan, checked)}
                  aria-label={
                    plan.isActive ? "Desativar plano" : "Ativar plano"
                  }
                />
              </div>

              <div>
                <p className="text-primary text-2xl font-bold">
                  {formatCurrency(plan.priceMonthly)}
                  <span className="text-muted-foreground text-xs font-normal">
                    {" "}
                    /mês
                  </span>
                </p>
                {plan.priceYearly !== null && (
                  <p className="text-muted-foreground text-xs">
                    ou {formatCurrency(plan.priceYearly)} /ano
                  </p>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-1.5 text-xs">
                <Badge variant="secondary" className="font-normal">
                  {limitLabel(plan.maxUnits, "unidades")}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {limitLabel(plan.maxBarbers, "barbeiros")}
                </Badge>
              </div>

              <ul className="space-y-1 text-sm">
                {FEATURE_KEYS.map((key) => {
                  const included = plan.features.includes(key)
                  return (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-2",
                        !included && "text-muted-foreground/60 line-through",
                      )}
                    >
                      <CheckIcon
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          included ? "text-primary" : "opacity-0",
                        )}
                      />
                      {FEATURES[key].label}
                    </li>
                  )
                })}
              </ul>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground text-xs">
                  {plan.barbershopsCount}{" "}
                  {plan.barbershopsCount === 1 ? "barbearia" : "barbearias"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar ${plan.name}`}
                    onClick={() => setForm(toForm(plan))}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    aria-label={`Excluir ${plan.name}`}
                    onClick={() => setPendingDeletion(plan)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
      >
        <DialogContent className="max-h-[90svh] w-[90%] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form?.id ? "Editar plano" : "Novo plano"}
            </DialogTitle>
            <DialogDescription>
              Deixe um limite em branco para não limitar.
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Nome</Label>
                <Input
                  id="plan-name"
                  value={form.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-description">Descrição</Label>
                <Textarea
                  id="plan-description"
                  rows={2}
                  value={form.description}
                  onChange={(event) =>
                    patch({ description: event.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-monthly">Preço mensal (R$)</Label>
                  <Input
                    id="plan-monthly"
                    inputMode="decimal"
                    value={form.priceMonthly}
                    onChange={(event) =>
                      patch({ priceMonthly: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-yearly">Preço anual (R$)</Label>
                  <Input
                    id="plan-yearly"
                    inputMode="decimal"
                    placeholder="Sem plano anual"
                    value={form.priceYearly}
                    onChange={(event) =>
                      patch({ priceYearly: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-units">Máx. de unidades</Label>
                  <Input
                    id="plan-units"
                    inputMode="numeric"
                    placeholder="Ilimitado"
                    value={form.maxUnits}
                    onChange={(event) =>
                      patch({ maxUnits: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-barbers">Máx. de barbeiros</Label>
                  <Input
                    id="plan-barbers"
                    inputMode="numeric"
                    placeholder="Ilimitado"
                    value={form.maxBarbers}
                    onChange={(event) =>
                      patch({ maxBarbers: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Funcionalidades</Label>
                {FEATURE_KEYS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {FEATURES[key].label}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {FEATURES[key].description}
                      </p>
                    </div>
                    <Switch
                      checked={form.features.includes(key)}
                      onCheckedChange={(checked) => toggleFeature(key, checked)}
                      aria-label={FEATURES[key].label}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Plano padrão</p>
                  <p className="text-muted-foreground text-xs">
                    Recebido por quem se cadastra.
                  </p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(checked) => patch({ isDefault: checked })}
                  aria-label="Plano padrão"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm font-medium">Ativo</p>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => patch({ isActive: checked })}
                  aria-label="Plano ativo"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-3">
            <DialogClose asChild>
              <Button variant="secondary" className="w-full">
                Cancelar
              </Button>
            </DialogClose>
            <Button className="w-full" disabled={isPending} onClick={save}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir {pendingDeletion?.name}?</DialogTitle>
            <DialogDescription>
              {pendingDeletion && pendingDeletion.barbershopsCount > 0
                ? "Há barbearias neste plano, então ele não pode ser excluído. Desative-o ou mude o plano delas."
                : "Essa ação é irreversível."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3">
            <DialogClose asChild>
              <Button variant="secondary" className="w-full">
                Voltar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="w-full"
              disabled={
                isPending || (pendingDeletion?.barbershopsCount ?? 0) > 0
              }
              onClick={remove}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PlansManager
