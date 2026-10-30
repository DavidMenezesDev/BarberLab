"use client"

import { Button } from "@/app/_components/ui/button"
import { cn } from "@/app/_lib/utils"
import {
  BuildingIcon,
  GaugeIcon,
  LogOutIcon,
  ShieldCheckIcon,
  MessageCircleIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
  { href: "/master", label: "Visão geral", icon: GaugeIcon, exact: true },
  { href: "/master/plans", label: "Planos", icon: TagIcon },
  { href: "/master/barbershops", label: "Barbearias", icon: BuildingIcon },
  { href: "/master/whatsapp", label: "WhatsApp", icon: MessageCircleIcon },
  { href: "/master/users", label: "Usuários", icon: UsersIcon },
] as const

const MasterNav = ({ userName }: { userName: string | null }) => {
  const pathname = usePathname()

  return (
    <header className="bg-card sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="text-primary h-5 w-5" />
          <span className="text-sm font-bold">Plataforma</span>
        </div>

        <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1">
          {ITEMS.map((item) => {
            const Icon = item.icon
            const active =
              "exact" in item
                ? pathname === item.href
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground hidden max-w-40 truncate text-sm sm:block">
            {userName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair da conta"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOutIcon />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default MasterNav
