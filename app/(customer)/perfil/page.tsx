import { getSavedCustomer } from "@/app/_actions/customer"
import Header from "@/app/_components/header"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { isSingleTenant } from "@/app/_lib/deployment"
import type { Metadata } from "next"
import Link from "next/link"
import CustomerForm from "./_components/customer-form"

export const metadata: Metadata = {
  title: "Meus dados | Barber Lab",
  description: "Dados de contato usados pela barbearia.",
  robots: { index: false, follow: false },
}

const Profile = async () => {
  const customer = await getSavedCustomer()

  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <Header singleTenant={isSingleTenant} />

      <div className="mx-auto max-w-2xl px-5 py-10 lg:px-8 lg:py-16">
        <header className="space-y-3 border-b pb-8">
          <p className="text-primary text-[11px] font-medium tracking-wider uppercase">
            Cadastro
          </p>
          <h1 className="text-2xl font-bold lg:text-3xl">Meus dados</h1>
          <p className="text-muted-foreground text-sm">
            Você não precisa de conta. Seus dados ficam salvos neste aparelho
            para as próximas reservas.
          </p>
        </header>

        <Card className="mt-8">
          <CardContent className="p-5 lg:p-6">
            {customer ? (
              <CustomerForm customer={customer} />
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Seu cadastro é criado na primeira reserva.
                </p>
                <Button asChild>
                  <Link href={isSingleTenant ? "/#servicos" : "/barbershops"}>
                    Fazer uma reserva
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Profile
