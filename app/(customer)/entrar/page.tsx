import Header from "@/app/_components/header"
import LoginForm from "@/app/_components/login-form"
import { Card, CardContent } from "@/app/_components/ui/card"
import { auth } from "@/app/_lib/auth"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Acesso da barbearia | Barber Lab",
  robots: { index: false, follow: false },
}

const Entrar = async ({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) => {
  const { callbackUrl } = await searchParams
  const session = await auth()

  // Só aceita caminhos do próprio site como destino.
  const destino =
    callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard"

  if (session?.user) redirect(destino)

  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <Header />

      <div className="mx-auto max-w-md px-5 py-10 lg:py-16">
        <Card>
          <CardContent className="space-y-5 p-5 lg:p-6">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Acesso da barbearia</h1>
              <p className="text-muted-foreground text-sm">
                Entre com seu e-mail e senha. Clientes não precisam de conta.
              </p>
            </div>

            <LoginForm callbackUrl={destino} />

            <p className="text-muted-foreground text-center text-xs">
              Ainda não tem barbearia?{" "}
              <Link href="/cadastro" className="text-primary underline">
                Cadastre a sua
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Entrar
