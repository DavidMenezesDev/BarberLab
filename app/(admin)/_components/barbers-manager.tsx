"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/_components/ui/avatar"
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
import { Switch } from "@/app/_components/ui/switch"
import { cn } from "@/app/_lib/utils"
import { PencilIcon, PlusIcon, Trash2Icon, UsersIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { deleteBarber, setBarberActive } from "../_actions/barbers"
import type { AdminBarber } from "../_data/get-barbers"
import BarberFormDialog from "./barber-form-dialog"
import EmptyState from "./empty-state"

interface BarbersManagerProps {
  barbers: AdminBarber[]
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

const BarbersManager = ({ barbers }: BarbersManagerProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBarber | null>(null)
  const [pendingDeletion, setPendingDeletion] = useState<AdminBarber | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (barber: AdminBarber) => {
    setEditing(barber)
    setIsFormOpen(true)
  }

  const handleToggle = (barber: AdminBarber, isActive: boolean) => {
    startTransition(async () => {
      const result = await setBarberActive(barber.id, isActive)
      if (result.ok) {
        toast.success(isActive ? "Barbeiro ativado." : "Barbeiro desativado.")
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = () => {
    if (!pendingDeletion) return
    const target = pendingDeletion

    startTransition(async () => {
      const result = await deleteBarber(target.id)
      if (result.ok) {
        toast.success("Barbeiro removido.")
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
          {barbers.length} {barbers.length === 1 ? "barbeiro" : "barbeiros"}
        </h2>
        <Button size="sm" className="lg:hidden" onClick={openCreate}>
          <PlusIcon />
          Novo
        </Button>
        <Button className="hidden lg:inline-flex" onClick={openCreate}>
          <PlusIcon />
          Novo barbeiro
        </Button>
      </div>

      {barbers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum barbeiro cadastrado"
          description="Adicione os profissionais que atendem na sua barbearia."
          action={
            <Button onClick={openCreate}>
              <PlusIcon />
              Adicionar o primeiro barbeiro
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {barbers.map((barber) => (
            <Card
              key={barber.id}
              className={cn(
                "overflow-hidden transition-opacity",
                !barber.isActive && "opacity-60",
                isPending && "pointer-events-none",
              )}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar className="h-14 w-14">
                  {barber.imageUrl && (
                    <AvatarImage src={barber.imageUrl} alt={barber.name} />
                  )}
                  <AvatarFallback>{getInitials(barber.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate font-semibold">{barber.name}</h3>
                  <p className="text-muted-foreground truncate text-xs">
                    {barber.specialty || "Sem especialidade"}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Editar ${barber.name}`}
                      onClick={() => openEdit(barber)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remover ${barber.name}`}
                      onClick={() => setPendingDeletion(barber)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>

                <Switch
                  checked={barber.isActive}
                  onCheckedChange={(checked) => handleToggle(barber, checked)}
                  aria-label={
                    barber.isActive ? "Desativar barbeiro" : "Ativar barbeiro"
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BarberFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        barber={editing}
      />

      <Dialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
      >
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>Remover {pendingDeletion?.name}?</DialogTitle>
            <DialogDescription>Essa ação é irreversível.</DialogDescription>
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
              disabled={isPending}
              onClick={handleDelete}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BarbersManager
