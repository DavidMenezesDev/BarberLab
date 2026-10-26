"use client"

import { Badge } from "@/app/_components/ui/badge"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { CopyIcon, MailPlusIcon, Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  createStaffInvite,
  removeStaffMember,
  revokeStaffInvite,
} from "../_actions/staff"

export interface StaffMember {
  id: string
  name: string | null
  email: string
  isOwner: boolean
  isSelf: boolean
}

export interface PendingInvite {
  id: string
  email: string
  token: string
  expiresAt: string
}

interface StaffManagerProps {
  members: StaffMember[]
  invites: PendingInvite[]
}

const inviteLink = (token: string) =>
  `${window.location.origin}/convite/${token}`

const copyLink = async (token: string) => {
  try {
    await navigator.clipboard.writeText(inviteLink(token))
    toast.success("Link do convite copiado.")
  } catch {
    toast.error("Não foi possível copiar. Selecione o link manualmente.")
  }
}

const StaffManager = ({ members, invites }: StaffManagerProps) => {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()

  const convidar = () =>
    startTransition(async () => {
      const result = await createStaffInvite({ email })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setEmail("")
      await copyLink(result.token)
      toast.success("Convite criado. Envie o link para a pessoa.")
    })

  const cancelar = (inviteId: string) =>
    startTransition(async () => {
      const result = await revokeStaffInvite(inviteId)
      if (result.ok) toast.success("Convite cancelado.")
      else toast.error(result.error)
    })

  const remover = (userId: string) =>
    startTransition(async () => {
      const result = await removeStaffMember(userId)
      if (result.ok) toast.success("Acesso removido.")
      else toast.error(result.error)
    })

  return (
    <Card>
      <CardContent className="space-y-5 p-4 lg:p-6">
        <div className="space-y-2">
          <label htmlFor="convite-email" className="text-sm font-medium">
            Convidar barbeiro (e-mail dele)
          </label>
          <div className="flex gap-2">
            <Input
              id="convite-email"
              type="email"
              placeholder="barbeiro@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button onClick={convidar} disabled={isPending || !email.trim()}>
              <MailPlusIcon />
              Convidar
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            A pessoa abre o link, cria a senha e entra. Barbeiros veem a
            dashboard e a agenda; serviços, equipe e ajustes ficam só com o
            dono.
          </p>
        </div>

        <ul className="divide-y">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {member.name ?? member.email}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {member.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.isOwner ? "default" : "secondary"}>
                  {member.isOwner ? "Dono" : "Barbeiro"}
                </Badge>
                {!member.isOwner && !member.isSelf && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover acesso"
                    disabled={isPending}
                    onClick={() => remover(member.id)}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            </li>
          ))}

          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{invite.email}</p>
                <p className="text-muted-foreground text-xs">
                  Convite pendente · expira em{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(invite.token)}
                >
                  <CopyIcon /> Copiar link
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cancelar convite"
                  disabled={isPending}
                  onClick={() => cancelar(invite.id)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default StaffManager
