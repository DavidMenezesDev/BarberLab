import Link from "next/link"
import LoginForm from "./login-form"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

const SignInDialog = () => {
  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Acesso da barbearia</DialogTitle>
        <DialogDescription>
          Para donos e barbeiros. Clientes não precisam de conta.
        </DialogDescription>
      </DialogHeader>

      <LoginForm />

      <p className="text-muted-foreground text-center text-xs">
        Ainda não tem barbearia?{" "}
        <Link href="/cadastro" className="text-primary underline">
          Cadastre a sua
        </Link>
      </p>
    </div>
  )
}

export default SignInDialog
