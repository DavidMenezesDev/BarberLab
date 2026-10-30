import { notFound } from "next/navigation"
import { requireSuperAdmin } from "@/app/_lib/auth"
import PageHeader from "@/app/(admin)/_components/page-header"
import { getPlans } from "../../_data/get-metrics"
import PlansManager from "../../_components/plans-manager"

const MasterPlans = async () => {
  // O layout sozinho não protege: o Next renderiza a página em paralelo.
  if (!(await requireSuperAdmin())) notFound()

  const plans = await getPlans()

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Planos"
        description="Preços, limites e funcionalidades liberadas em cada plano."
      />
      <PlansManager plans={plans} />
    </>
  )
}

export default MasterPlans
