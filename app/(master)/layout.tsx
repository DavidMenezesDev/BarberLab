import { requireSuperAdmin } from "@/app/_lib/auth"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import MasterNav from "./_components/master-nav"

// Tudo aqui lê o banco a cada acesso; nada pode ser pré-renderizado no build.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Plataforma | Barber Lab",
  description: "Administração da plataforma: planos, barbearias e usuários.",
  robots: { index: false, follow: false },
}

const MasterLayout = async ({ children }: { children: React.ReactNode }) => {
  // Quem não é da plataforma não descobre que o painel existe.
  const admin = await requireSuperAdmin()
  if (!admin) notFound()

  return (
    <div className="min-h-full">
      <MasterNav userName={admin.name} />
      <main className="mx-auto max-w-6xl space-y-8 p-5 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  )
}

export default MasterLayout
