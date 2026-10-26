"use client"

import { Button } from "@/app/_components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form"
import { Input } from "@/app/_components/ui/input"
import { Switch } from "@/app/_components/ui/switch"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { upsertBarber } from "../_actions/barbers"
import type { AdminBarber } from "../_data/get-barbers"
import { barberSchema, type BarberInput } from "../_lib/barber-schema"

const EMPTY: BarberInput = {
  name: "",
  specialty: "",
  imageUrl: "",
  isActive: true,
}

interface BarberFormDialogProps {
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void
  barber?: AdminBarber | null
}

const BarberFormDialog = ({
  open,
  onOpenChange,
  barber,
}: BarberFormDialogProps) => {
  const form = useForm<BarberInput>({
    resolver: zodResolver(barberSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (!open) return
    form.reset(
      barber
        ? {
            id: barber.id,
            name: barber.name,
            specialty: barber.specialty,
            imageUrl: barber.imageUrl,
            isActive: barber.isActive,
          }
        : EMPTY,
    )
  }, [open, barber, form])

  const onSubmit = async (values: BarberInput) => {
    const result = await upsertBarber(values)

    if (result.ok) {
      toast.success(barber ? "Barbeiro atualizado." : "Barbeiro adicionado.")
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[92%] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {barber ? "Editar barbeiro" : "Novo barbeiro"}
          </DialogTitle>
          <DialogDescription>
            Cadastre quem atende na sua barbearia.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Degradê e barba" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da foto (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      inputMode="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Em atividade</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      Desative para quem saiu ou está afastado, sem apagar o
                      cadastro.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {barber ? "Salvar" : "Adicionar barbeiro"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default BarberFormDialog
