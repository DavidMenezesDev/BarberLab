"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { UserIcon } from "lucide-react"
import SignInDialog from "./sign-in-dialog"
import { Button } from "./ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover"
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog"
import UserInfo from "./user-info"
import Link from "next/link"

const UserMenu = () => {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoggedIn = !!session?.user

  if (!mounted || status === "loading") {
    return null
  }

  const userButton = (
    <Button
      variant="ghost"
      size="icon"
      className={`hover:bg-primary/10 flex items-center gap-2 ${isLoggedIn ? "text-green-600" : ""}`}
    >
      <UserIcon
        className="h-5 w-5"
        fill={isLoggedIn ? "currentColor" : "none"}
      />
    </Button>
  )

  if (isLoggedIn) {
    return (
      <Popover>
        <PopoverTrigger asChild>{userButton}</PopoverTrigger>
        <PopoverContent className="mt-2 w-64">
          {session?.user && <UserInfo user={session.user} />}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog>
      <Popover>
        <PopoverTrigger asChild>{userButton}</PopoverTrigger>
        <PopoverContent className="mt-2 w-56 space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/perfil">Meus dados</Link>
          </Button>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full text-xs">
              Acesso da barbearia
            </Button>
          </DialogTrigger>
        </PopoverContent>
      </Popover>
      <DialogContent className="w-[90%]">
        <SignInDialog />
      </DialogContent>
    </Dialog>
  )
}

export default UserMenu
