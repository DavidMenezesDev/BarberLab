"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

interface LoginFormProps {
  callbackUrl?: string
  defaultEmail?: string
}

const LoginForm = ({
  callbackUrl = "/dashboard",
  defaultEmail = "",
}: LoginFormProps) => {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()

  const entrar = (event: React.FormEvent) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        toast.error("E-mail ou senha incorretos.")
        return
      }

      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-senha" className="text-sm font-medium">
          Senha
        </label>
        <Input
          id="login-senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !email.trim() || !password}
      >
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}

export default LoginForm
