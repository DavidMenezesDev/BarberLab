"use client"

import { acceptStaffInvite } from "@/app/_actions/accept-invite"
import { Button } from "@/app/_components/ui/button"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

const AcceptButton = ({ token }: { token: string }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const aceitar = () =>
    startTransition(async () => {
      const result = await acceptStaffInvite(token)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Convite aceito!")
      router.push("/dashboard")
      router.refresh()
    })

  return (
    <Button onClick={aceitar} disabled={isPending}>
      {isPending ? "Entrando..." : "Aceitar convite"}
    </Button>
  )
}

export default AcceptButton
