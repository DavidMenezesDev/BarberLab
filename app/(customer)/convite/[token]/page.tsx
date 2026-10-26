import Header from "@/app/_components/header"
import LoginForm from "@/app/_components/login-form"
import { Card, CardContent } from "@/app/_components/ui/card"
import { auth } from "@/app/_lib/auth"
import { db } from "@/app/_lib/prisma"
import type { Metadata } from "next"
import AcceptButton from "./accept-button"
import RegisterForm from "./register-form"

export const metadata: Metadata = {
  title: "Convite | Barber Lab",
  robots: { index: false, follow: false },
}

const Convite = async ({ params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params

  const [session, invite] = await Promise.all([
    auth(),
    db.staffInvite.findUnique({
      where: { token },
      select: {
        email: true,
        expiresAt: true,
        acceptedAt: true,
        barbershop: { select: { name: true } },
      },
    }),
  ])

  const valido = !!invite && !invite.acceptedAt && invite.expiresAt > new Date()

  const hasAccount =
    valido &&
    !!(await db.user.findUnique({
      where: { email: invite.email.toLowerCase() },
      select: { id: true },
    }))

  return (
    <div className="from-background via-background to-muted/20 min-h-svh bg-linear-to-br">
      <Header />

      <div className="mx-auto max-w-xl px-5 py-10 lg:py-16">
        <Card>
          <CardContent className="space-y-4 p-5 lg:p-6">
            {!valido ? (
              <>
                <h1 className="text-xl font-bold">Convite indisponível</h1>
                <p className="text-muted-foreground text-sm">
                  Este convite expirou, já foi usado ou foi cancelado. Peça um
                  novo ao dono da barbearia.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold">
                  Entrar na equipe da {invite.barbershop.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Convite para <strong>{invite.email}</strong>. Você vai poder
                  ver a agenda e atender os clientes.
                </p>

                {session?.user ? (
                  <AcceptButton token={token} />
                ) : hasAccount ? (
                  <>
                    <p className="text-muted-foreground text-sm">
                      Já existe uma conta com este e-mail. Entre para aceitar.
                    </p>
                    <LoginForm
                      callbackUrl={`/convite/${token}`}
                      defaultEmail={invite.email}
                    />
                  </>
                ) : (
                  <RegisterForm token={token} email={invite.email} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Convite
