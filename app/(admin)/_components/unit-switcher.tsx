"use client"

import { Button } from "@/app/_components/ui/button"
import { Select } from "@/app/_components/ui/select"
import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { switchBarbershop } from "../_actions/units"
import NewUnitDialog from "./new-unit-dialog"

interface UnitSwitcherProps {
  units: { id: string; name: string }[]
  activeId: string
  canCreate: boolean
}

const UnitSwitcher = ({ units, activeId, canCreate }: UnitSwitcherProps) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)

  const onChange = (id: string) => {
    startTransition(async () => {
      const result = await switchBarbershop(id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      {units.length > 1 && (
        <Select
          aria-label="Unidade"
          value={activeId}
          disabled={pending}
          onChange={(event) => onChange(event.target.value)}
        >
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </Select>
      )}

      {canCreate && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setCreating(true)}
          >
            <PlusIcon size={16} />
            Nova unidade
          </Button>
          <NewUnitDialog open={creating} onOpenChange={setCreating} />
        </>
      )}
    </div>
  )
}

export default UnitSwitcher
