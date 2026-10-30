// Uso: npm run db:seed-admin
// Lê SUPER_ADMIN_EMAIL, SUPER_ADMIN_NAME e SUPER_ADMIN_PASSWORD (opcionais).
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { ensureSuperAdmin } from "../prisma/super-admin"

const main = async () => {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })

  try {
    const result = await ensureSuperAdmin(prisma)
    console.log(
      `[super-admin] ${result.email}: ${result.status}`,
      result.reason ?? "",
    )
    if (result.status === "skipped") process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
