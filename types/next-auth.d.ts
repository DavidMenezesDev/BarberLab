import type { Role, StaffRole } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  // eslint-disable-next-line no-unused-vars
  interface Session {
    user: {
      id: string
      role: Role
      staffRole: StaffRole | null
      barbershopId: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/adapters" {
  // eslint-disable-next-line no-unused-vars
  interface AdapterUser {
    role: Role
    staffRole: StaffRole | null
    barbershopId: string | null
  }
}

declare module "next-auth/jwt" {
  // eslint-disable-next-line no-unused-vars
  interface JWT {
    id: string
    role: Role
    staffRole: StaffRole | null
    barbershopId: string | null
  }
}
