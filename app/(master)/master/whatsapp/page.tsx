import { requireSuperAdmin } from "@/app/_lib/auth"
import { notFound } from "next/navigation"
import PageHeader from "@/app/(admin)/_components/page-header"
import WhatsAppManager from "../../_components/whatsapp-manager"
import WhatsAppLogs from "../../_components/whatsapp-logs"
import {
  getWhatsAppConnections,
  getWhatsAppLogs,
} from "../../_data/get-whatsapp"

const MasterWhatsApp = async () => {
  // O layout sozinho não protege: o Next renderiza a página em paralelo.
  if (!(await requireSuperAdmin())) notFound()

  const [{ connections, barbershops }, logs] = await Promise.all([
    getWhatsAppConnections(),
    getWhatsAppLogs(),
  ])

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="WhatsApp"
        description="Números que avisam os clientes quando um horário é marcado."
      />
      <WhatsAppManager connections={connections} barbershops={barbershops} />
      <WhatsAppLogs logs={logs} />
    </>
  )
}

export default MasterWhatsApp
