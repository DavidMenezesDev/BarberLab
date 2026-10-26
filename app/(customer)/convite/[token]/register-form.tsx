"use client"

import { registerWithInvite } from "@/app/_actions/accept-invite"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

const RegisterForm = ({ token, email }: { token: string; email: string }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const criar = (event: React.FormEvent) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await registerWithInvite({
        token,
        name,
        phone,
        password,
        confirmPassword,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      const login = await signIn("credentials", {
        email: result.email,
        password,
        redirect: false,
      })

      toast.success("Conta criada!")
      router.push(login?.ok ? "/dashboard" : "/entrar")
      router.refresh()
    })
  }

  return (
    <form onSubmit={criar} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="conv-email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="conv-email" value={email} readOnly disabled />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="conv-nome" className="text-sm font-medium">
          Seu nome *
        </label>
        <Input
          id="conv-nome"
          autoComplete="name"
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="conv-tel" className="text-sm font-medium">
          Seu telefone com WhatsApp *
        </label>
        <Input
          id="conv-tel"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="conv-senha" className="text-sm font-medium">
            Senha *
          </label>
          <Input
            id="conv-senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="conv-senha2" className="text-sm font-medium">
            Confirme a senha *
          </label>
          <Input
            id="conv-senha2"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Criando..." : "Criar conta e entrar na equipe"}
      </Button>
    </form>
  )
}

export default RegisterForm
