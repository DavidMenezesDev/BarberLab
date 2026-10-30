// Uso: npx tsx --env-file=.env.local scripts/grant-super-admin.ts email@exemplo.com
// Dá (ou, com --revoke, tira) o acesso ao painel da plataforma. É o único
// caminho para criar o primeiro super-admin: o painel não promove ninguém.
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "@prisma/client"

const main = async () => {
  const [email, flag] = process.argv.slice(2)
  if (!email) {
    console.error("Informe o e-mail da conta.")
    process.exit(1)
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

  try {
    const role = flag === "--revoke" ? Role.CUSTOMER : Role.SUPER_ADMIN
    const result = await prisma.user.updateMany({
      where: { email: email.trim().toLowerCase() },
      data: { role },
    })

    if (result.count === 0) {
      console.error("Nenhuma conta com esse e-mail. Crie a conta antes.")
      process.exit(1)
    }
    console.log(`${email}: ${role}`)
  } finally {
    await prisma.$disconnect()
  }
}

main()
