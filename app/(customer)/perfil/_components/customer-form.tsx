"use client"

import { updateOwnCustomer } from "@/app/_actions/customer"
import CustomerFields from "@/app/_components/customer-fields"
import { Button } from "@/app/_components/ui/button"
import type { SavedCustomer } from "@/app/_lib/customer-schema"
import { SaveIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

const CustomerForm = ({ customer }: { customer: SavedCustomer }) => {
  const [value, setValue] = useState(customer)
  const [isSaving, startSaving] = useTransition()

  const salvar = () =>
    startSaving(async () => {
      const result = await updateOwnCustomer(value)
      if (result.ok) {
        toast.success("Dados salvos.")
      } else {
        toast.error(result.error)
      }
    })

  return (
    <div className="space-y-4">
      <CustomerFields
        idPrefix="perfil"
        value={value}
        onChange={setValue}
        disabled={isSaving}
      />
      <p className="text-muted-foreground text-xs">
        A barbearia usa o telefone para confirmar ou avisar sobre mudanças no
        seu horário.
      </p>

      <Button
        onClick={salvar}
        disabled={isSaving || !value.name.trim() || !value.phone.trim()}
      >
        <SaveIcon />
        {isSaving ? "Salvando..." : "Salvar dados"}
      </Button>
    </div>
  )
}

export default CustomerForm
