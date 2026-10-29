import { Role, StaffRole } from "@prisma/client"
import { AuthOptions, getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { cache } from "react"
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

      // O papel vem do banco a cada leitura: aceitar convite, cadastrar a
      // barbearia ou remover acesso valem na hora. A unidade ativa e o papel
      // nela são resolvidos em requireBarbershopAdmin.
      if (token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        })

        token.role = isDemo ? Role.BARBER_ADMIN : (fresh?.role ?? Role.CUSTOMER)
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role ?? Role.CUSTOMER,
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

export const ACTIVE_BARBERSHOP_COOKIE = "active_barbershop"

export interface AdminUnit {
  id: string
  name: string
  imageUrl: string
  staffRole: StaffRole
}

// Unidades em que o usuário atua, da mais antiga para a mais nova.
export const getAdminUnits = cache(async (userId: string) => {
  const memberships = await db.barbershopMember.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      staffRole: true,
      barbershop: { select: { id: true, name: true, imageUrl: true } },
    },
  })

  return memberships.map(({ staffRole, barbershop }): AdminUnit => ({
    ...barbershop,
    staffRole,
  }))
})

export const requireBarbershopAdmin = async () => {
  const session = await auth()

  if (!session?.user || session.user.role !== Role.BARBER_ADMIN) {
    return null
  }

  const base = {
    userId: session.user.id,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  }

  if (isDemo) {
    return {
      ...base,
      barbershopId: DEMO_BARBERSHOP_ID!,
      staffRole: StaffRole.OWNER,
      units: [] as AdminUnit[],
    }
  }

  const units = await getAdminUnits(session.user.id)
  if (units.length === 0) return null

  // O cookie só escolhe entre as unidades do próprio usuário: um valor
  // adulterado cai na primeira em vez de abrir a barbearia de outra pessoa.
  const wanted = (await cookies()).get(ACTIVE_BARBERSHOP_COOKIE)?.value
  const active = units.find((unit) => unit.id === wanted) ?? units[0]

  return {
    ...base,
    barbershopId: active.id,
    staffRole: active.staffRole,
    units,
  }
}

// Serviços, equipe, ajustes e horários são do dono; o barbeiro cuida da agenda.
export const requireBarbershopOwner = async () => {
  const admin = await requireBarbershopAdmin()

  if (!admin || admin.staffRole !== StaffRole.OWNER) return null

  return admin
}
