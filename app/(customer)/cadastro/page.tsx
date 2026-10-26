import Header from "@/app/_components/header"
import { Card, CardContent } from "@/app/_components/ui/card"
import { auth } from "@/app/_lib/auth"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import SignupForm from "./signup-form"

export const metadata: Metadata = {
  title: "Cadastre sua barbearia | Barber Lab",
  description:
    "Crie a página da sua barbearia, cadastre serviços e receba agendamentos online.",
}

const Cadastro = async () => {
  const session = await auth()

  if (session?.user?.barbershopId) redirect("/dashboard")

  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <Header />

      <div className="mx-auto max-w-xl px-5 py-10 lg:py-16">
        <header className="space-y-3 border-b pb-8">
          <p className="text-primary text-[11px] font-medium tracking-wider uppercase">
            Para barbearias
          </p>
          <h1 className="text-2xl font-bold lg:text-3xl">
            Cadastre sua barbearia
          </h1>
          <p className="text-muted-foreground text-sm">
            Crie seu acesso com e-mail e senha e já cadastre serviços, equipe e
            horários. Seus clientes agendam sem criar conta.
          </p>
        </header>

        <Card className="mt-8">
          <CardContent className="p-5 lg:p-6">
            <SignupForm />

            <p className="text-muted-foreground mt-6 text-center text-xs">
              Já tem cadastro?{" "}
              <Link href="/entrar" className="text-primary underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Cadastro
