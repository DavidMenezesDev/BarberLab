"use client"

import { Switch } from "@/app/_components/ui/switch"
import { useTransition } from "react"
import { toast } from "sonner"
import { setUserDisabled } from "../_actions/users"

interface UserAccessSwitchProps {
  userId: string
  active: boolean
  locked: boolean
}

const UserAccessSwitch = ({
  userId,
  active,
  locked,
}: UserAccessSwitchProps) => {
  const [isPending, startTransition] = useTransition()

  return (
    <Switch
      checked={active}
      disabled={locked || isPending}
      aria-label={active ? "Bloquear acesso" : "Liberar acesso"}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          const result = await setUserDisabled(userId, !checked)
          if (result.ok)
            toast.success(checked ? "Acesso liberado." : "Acesso bloqueado.")
          else toast.error(result.error)
        })
      }
    />
  )
}

export default UserAccessSwitch
