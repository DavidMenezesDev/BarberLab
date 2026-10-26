import { Role, StaffRole } from "@prisma/client"
import { AuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { DEMO_BARBERSHOP_ID, isDemo } from "./deployment"
import { verifyPassword } from "./password"
import { db } from "./prisma"
import { consumeRateLimit } from "./rate-limit"

const IP_DESCONHECIDO = "unknown"

const ipDaRequisicao = (headers: unknown) => {
  const valor = (headers as Record<string, string | undefined> | undefined)?.[
    "x-forwarded-for"
  ]
  return valor?.split(",")[0]?.trim() || IP_DESCONHECIDO
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "E-mail e senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password

        if (!email || !password) return null

        // Limita tentativas por e-mail e por IP contra adivinhação de senha.
        const [porEmail, porIp] = await Promise.all([
          consumeRateLimit("login", `email:${email}`),
          consumeRateLimit("login", `ip:${ipDaRequisicao(req?.headers)}`),
        ])
        if (!porEmail.allowed || !porIp.allowed) return null

        const user = await db.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, passwordHash: true },
        })

        // Compara mesmo sem usuário, para não revelar se o e-mail existe.
        const senhaConfere = await verifyPassword(
          password,
          user?.passwordHash ?? null,
        )
        if (!user || !senhaConfere) return null

        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id

      // Papel e barbearia vêm do banco a cada leitura: aceitar convite,
      // cadastrar a barbearia ou remover acesso valem na hora.
      if (token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, staffRole: true, barbershopId: true },
        })

        token.role = isDemo ? Role.BARBER_ADMIN : (fresh?.role ?? Role.CUSTOMER)
        token.staffRole = isDemo ? StaffRole.OWNER : (fresh?.staffRole ?? null)
        token.barbershopId = isDemo
          ? DEMO_BARBERSHOP_ID!
          : (fresh?.barbershopId ?? null)
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role ?? Role.CUSTOMER,
        staffRole: token.staffRole ?? null,
        barbershopId: token.barbershopId ?? null,
      }
      return session
    },
  },
  secret: process.env.NEXT_AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/entrar",
  },
  debug: false,
}

export const auth = () => getServerSession(authOptions)

export const requireBarbershopAdmin = async () => {
  const session = await auth()

  if (!session?.user || session.user.role !== Role.BARBER_ADMIN) {
    return null
  }

  if (!session.user.barbershopId) {
    return null
  }

  return {
    userId: session.user.id,
    barbershopId: session.user.barbershopId,
    staffRole: session.user.staffRole ?? StaffRole.BARBER,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }
}

// Serviços, equipe, ajustes e horários são do dono; o barbeiro cuida da agenda.
export const requireBarbershopOwner = async () => {
  const admin = await requireBarbershopAdmin()

  if (!admin || admin.staffRole !== StaffRole.OWNER) return null

  return admin
}
