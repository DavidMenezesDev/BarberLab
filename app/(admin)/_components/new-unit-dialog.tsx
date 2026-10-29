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
import ImageUploadField from "@/app/_components/image-upload-field"
import { Input } from "@/app/_components/ui/input"
import { Textarea } from "@/app/_components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { createUnit } from "../_actions/units"
import { newUnitSchema, type NewUnitInput } from "../_lib/unit-schema"

const EMPTY: NewUnitInput = {
  name: "",
  address: "",
  city: "",
  phone: "",
  description: "",
  imageUrl: "",
}

interface NewUnitDialogProps {
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void
}

const NewUnitDialog = ({ open, onOpenChange }: NewUnitDialogProps) => {
  const router = useRouter()
  const form = useForm<NewUnitInput>({
    resolver: zodResolver(newUnitSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) form.reset(EMPTY)
  }, [open, form])

  const onSubmit = async (values: NewUnitInput) => {
    const result = await createUnit(values)

    if (result.ok) {
      toast.success("Unidade criada. Você já está nela.")
      onOpenChange(false)
      router.push("/dashboard")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[92%] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova unidade</DialogTitle>
          <DialogDescription>
            Cada unidade tem a própria agenda, equipe, serviços e página
            pública.
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
                    <Input placeholder="Barber Lab Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
                  <FormLabel>Foto (opcional)</FormLabel>
                  <FormControl>
                    <ImageUploadField
                      value={field.value}
                      onChange={field.onChange}
                      previewClassName="h-32"
                    />
                  </FormControl>
                  <FormMessage />
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
                Criar unidade
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default NewUnitDialog
