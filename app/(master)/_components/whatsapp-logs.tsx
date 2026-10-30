import { Badge } from "@/app/_components/ui/badge"
import { Card, CardContent } from "@/app/_components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { WhatsAppLogRow } from "../_data/get-whatsapp"

const STATUS = {
  SENT: { label: "Enviada", variant: "default" },
  FAILED: { label: "Falhou", variant: "destructive" },
  SKIPPED: { label: "Não enviada", variant: "secondary" },
} as const

const KINDS: Record<string, string> = {
  BOOKING_CREATED: "Agendamento marcado",
}

const WhatsAppLogs = ({ logs }: { logs: WhatsAppLogRow[] }) => (
  <section className="space-y-3">
    <h2 className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
      Histórico de envios (últimos {logs.length})
    </h2>

    {logs.length === 0 ? (
      <p className="text-muted-foreground text-sm">Nenhum envio ainda.</p>
    ) : (
      <Card>
        <CardContent className="divide-y p-0">
          {logs.map((log) => (
            <details key={log.id} className="group p-4">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <Badge variant={STATUS[log.status].variant}>
                  {STATUS[log.status].label}
                </Badge>
                <span className="font-medium">
                  {KINDS[log.kind] ?? log.kind}
                </span>
                <span className="text-muted-foreground">
                  {log.barbershopName ?? "—"}
                  {log.phone ? ` · +${log.phone}` : ""}
                  {log.connectionName ? ` · via ${log.connectionName}` : ""}
                </span>
                <time className="text-muted-foreground ml-auto text-xs">
                  {format(log.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </time>
              </summary>
              {(log.error || log.body) && (
                <div className="mt-3 space-y-2 text-sm">
                  {log.error && <p className="text-destructive">{log.error}</p>}
                  {log.body && (
                    <pre className="bg-muted rounded-md p-3 font-sans whitespace-pre-wrap">
                      {log.body}
                    </pre>
                  )}
                </div>
              )}
            </details>
          ))}
        </CardContent>
      </Card>
    )}
  </section>
)

export default WhatsAppLogs
