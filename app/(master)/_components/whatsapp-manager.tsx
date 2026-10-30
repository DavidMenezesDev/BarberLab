"use client"

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
import { Select } from "@/app/_components/ui/select"
import { Switch } from "@/app/_components/ui/switch"
import type { ConnectionStatus } from "@/app/_lib/whatsapp/providers"
import { LinkIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  checkWhatsAppConnection,
  deleteWhatsAppConnection,
  disconnectWhatsApp,
  saveWhatsAppConnection,
  setWhatsAppEnabled,
  startWhatsAppConnection,
} from "../_actions/whatsapp"
import type { WhatsAppConnectionRow } from "../_data/get-whatsapp"

interface FormState {
  id?: string
  name: string
  provider: "WAHA" | "UAZAPI"
  baseUrl: string
  apiKey: string
  sessionName: string
  barbershopId: string
  isDefault: boolean
}

const EMPTY: FormState = {
  name: "",
  provider: "WAHA",
  baseUrl: "",
  apiKey: "",
  sessionName: "",
  barbershopId: "",
  isDefault: false,
}

const POLL_MS = 3000

const ConnectDialog = ({
  connection,
  onClose,
}: {
  connection: WhatsAppConnectionRow
  onClose: () => void
}) => {
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [pairingPhone, setPairingPhone] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  // Depois de iniciar, consulta o provedor até a leitura do QR ser confirmada.
  const waiting = status?.state === "PENDING"
  useEffect(() => {
    if (!waiting) return
    const timer = setInterval(async () => {
      const result = await checkWhatsAppConnection(connection.id, pairingPhone)
      if (!result.ok) return
      setStatus(result.status)
      if (result.status.state === "CONNECTED")
        toast.success("WhatsApp conectado.")
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [waiting, connection.id, pairingPhone])

  const start = (usePhone: boolean) =>
    startTransition(async () => {
      const target = usePhone ? phone : undefined
      const result = await startWhatsAppConnection(connection.id, target)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setPairingPhone(target)
      setStatus(result.status)
    })

  const connected =
    status?.state === "CONNECTED" || (!status && connection.phone)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conectar {connection.name}</DialogTitle>
          <DialogDescription>
            No celular: WhatsApp → Aparelhos conectados → Conectar aparelho.
          </DialogDescription>
        </DialogHeader>

        {connected ? (
          <p className="text-sm">
            Conectado
            {(status?.phone ?? connection.phone) &&
            (status?.phone ?? connection.phone) !== "conectado"
              ? ` como +${status?.phone ?? connection.phone}`
              : ""}
            .
          </p>
        ) : (
          <div className="space-y-4">
            {status?.qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={status.qr}
                alt="QR code para conectar o WhatsApp"
                className="mx-auto h-56 w-56 rounded-md bg-white p-2"
              />
            )}
            {status?.pairCode && (
              <p className="text-center text-2xl font-bold tracking-widest">
                {status.pairCode}
              </p>
            )}
            {waiting && !status?.qr && !status?.pairCode && (
              <p className="text-muted-foreground text-sm">
                Aguardando o provedor gerar o código…
              </p>
            )}
            {status?.state === "ERROR" && (
              <p className="text-destructive text-sm">
                A sessão falhou no provedor. Tente conectar de novo.
              </p>
            )}

            <div className="space-y-2">
              <Button disabled={isPending} onClick={() => start(false)}>
                {waiting ? "Gerar novo QR code" : "Conectar com QR code"}
              </Button>
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ou use um código: (11) 99999-9999"
                  inputMode="tel"
                />
                <Button
                  variant="outline"
                  disabled={isPending || !phone}
                  onClick={() => start(true)}
                >
                  Código
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const WhatsAppManager = ({
  connections,
  barbershops,
}: {
  connections: WhatsAppConnectionRow[]
  barbershops: { id: string; name: string }[]
}) => {
  const [form, setForm] = useState<FormState | null>(null)
  const [connecting, setConnecting] = useState<WhatsAppConnectionRow | null>(
    null,
  )
  const [isPending, startTransition] = useTransition()

  const patch = (changes: Partial<FormState>) =>
    setForm((current) => (current ? { ...current, ...changes } : current))

  const run = (
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(success)
      else toast.error(result.error)
    })

  const save = () => {
    if (!form) return
    startTransition(async () => {
      const result = await saveWhatsAppConnection({
        ...form,
        barbershopId:
          form.isDefault || !form.barbershopId ? null : form.barbershopId,
      })
      if (result.ok) {
        toast.success("Conexão salva.")
        setForm(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const editing = Boolean(form?.id)

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
          {connections.length} {connections.length === 1 ? "número" : "números"}
        </h2>
        <Button onClick={() => setForm(EMPTY)}>
          <PlusIcon />
          Novo número
        </Button>
      </div>

      {connections.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum número cadastrado. Sem um número conectado, os clientes não
          recebem aviso de agendamento.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{connection.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {connection.provider} · {connection.baseUrl}
                  </p>
                </div>
                <Badge variant={connection.phone ? "default" : "secondary"}>
                  {connection.phone ? "Conectado" : "Desconectado"}
                </Badge>
              </div>

              <p className="text-sm">
                {connection.isDefault
                  ? "Número padrão do sistema"
                  : `Número externo de ${connection.barbershop?.name ?? "—"}`}
                {connection.phone && connection.phone !== "conectado"
                  ? ` · +${connection.phone}`
                  : ""}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setConnecting(connection)}>
                  <LinkIcon />
                  {connection.phone ? "Ver conexão" : "Conectar"}
                </Button>
                {connection.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() =>
                      run(
                        () => disconnectWhatsApp(connection.id),
                        "Desconectado.",
                      )
                    }
                  >
                    Desconectar
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Editar"
                  onClick={() =>
                    setForm({
                      id: connection.id,
                      name: connection.name,
                      provider: connection.provider,
                      baseUrl: connection.baseUrl,
                      apiKey: "",
                      sessionName: connection.sessionName,
                      barbershopId: connection.barbershopId ?? "",
                      isDefault: connection.isDefault,
                    })
                  }
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Excluir"
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Excluir ${connection.name}?`))
                      run(
                        () => deleteWhatsAppConnection(connection.id),
                        "Número excluído.",
                      )
                  }}
                >
                  <Trash2Icon />
                </Button>
                <label className="ml-auto flex items-center gap-2 text-sm">
                  Ativo
                  <Switch
                    checked={connection.enabled}
                    disabled={isPending}
                    onCheckedChange={(enabled) =>
                      run(
                        () => setWhatsAppEnabled(connection.id, enabled),
                        enabled ? "Ativado." : "Desativado.",
                      )
                    }
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {connecting && (
        <ConnectDialog
          key={connecting.id}
          connection={connecting}
          onClose={() => setConnecting(null)}
        />
      )}

      <Dialog
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar número" : "Novo número"}
            </DialogTitle>
            <DialogDescription>
              Provedor, URL e sessão não mudam depois de criados.
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wa-name">Nome</Label>
                <Input
                  id="wa-name"
                  value={form.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="Número do sistema"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="wa-provider">Provedor</Label>
                  <Select
                    id="wa-provider"
                    value={form.provider}
                    disabled={editing}
                    onChange={(event) =>
                      patch({
                        provider: event.target.value as FormState["provider"],
                      })
                    }
                  >
                    <option value="WAHA">WAHA</option>
                    <option value="UAZAPI">UAZAPI</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wa-session">
                    {form.provider === "WAHA" ? "Sessão" : "Instância"}
                  </Label>
                  <Input
                    id="wa-session"
                    value={form.sessionName}
                    disabled={editing}
                    onChange={(event) =>
                      patch({ sessionName: event.target.value })
                    }
                    placeholder="barberlab"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-url">URL do provedor</Label>
                <Input
                  id="wa-url"
                  value={form.baseUrl}
                  disabled={editing}
                  onChange={(event) => patch({ baseUrl: event.target.value })}
                  placeholder="https://waha.exemplo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wa-key">
                  {form.provider === "WAHA" ? "API key" : "Admin token"}
                </Label>
                <Input
                  id="wa-key"
                  type="password"
                  autoComplete="off"
                  value={form.apiKey}
                  onChange={(event) => patch({ apiKey: event.target.value })}
                  placeholder={editing ? "Deixe vazio para manter a atual" : ""}
                />
              </div>

              <label className="flex items-center justify-between gap-3 text-sm">
                Número padrão do sistema (todas as barbearias)
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(isDefault) => patch({ isDefault })}
                />
              </label>
              {!form.isDefault && (
                <div className="space-y-1.5">
                  <Label htmlFor="wa-shop">Número externo da barbearia</Label>
                  <Select
                    id="wa-shop"
                    value={form.barbershopId}
                    onChange={(event) =>
                      patch({ barbershopId: event.target.value })
                    }
                  >
                    <option value="">Escolha…</option>
                    {barbershops.map((barbershop) => (
                      <option key={barbershop.id} value={barbershop.id}>
                        {barbershop.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button disabled={isPending} onClick={save}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WhatsAppManager
