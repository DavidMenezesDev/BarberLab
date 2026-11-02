"use client"

import {
  checkSlugAvailability,
  createBarbershop,
} from "@/app/(admin)/_actions/signup"
import { Button } from "@/app/_components/ui/button"
import ImageUploadField from "@/app/_components/image-upload-field"
import { Input } from "@/app/_components/ui/input"
import { Textarea } from "@/app/_components/ui/textarea"
import {
  SLUG_FORMAT_MESSAGE,
  SLUG_PATTERN,
  slugify,
} from "@/app/_lib/slug-format"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

interface FieldProps {
  id: string
  label: string
  optional?: boolean
  children: React.ReactNode
}

const Field = ({ id, label, optional, children }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-sm font-medium">
      {label}{" "}
      {optional && <span className="text-muted-foreground">(opcional)</span>}
    </label>
    {children}
  </div>
)

type SlugStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "invalid"; message: string }

interface SignupFormProps {
  rootDomain: string | null
}

const SignupForm = ({ rootDomain }: SignupFormProps) => {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [ownerName, setOwnerName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [ownerPhone, setOwnerPhone] = useState("")
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  // Enquanto o barbeiro não mexe no endereço, ele acompanha o nome.
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ state: "idle" })
  const [document, setDocument] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [phones, setPhones] = useState([""])

  useEffect(() => {
    if (!slug) {
      setSlugStatus({ state: "idle" })
      return
    }
    if (!SLUG_PATTERN.test(slug)) {
      setSlugStatus({ state: "invalid", message: SLUG_FORMAT_MESSAGE })
      return
    }

    setSlugStatus({ state: "checking" })
    let cancelled = false
    const timer = setTimeout(async () => {
      const result = await checkSlugAvailability(slug)
      if (cancelled) return
      setSlugStatus(
        result.ok
          ? { state: "available" }
          : { state: "invalid", message: result.error },
      )
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [slug])

  const changeName = (value: string) => {
    setName(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  const setPhone = (index: number, value: string) =>
    setPhones((current) => current.map((p, i) => (i === index ? value : p)))

  const enviar = () =>
    startSaving(async () => {
      const result = await createBarbershop({
        ownerName,
        ownerPhone,
        email,
        password,
        confirmPassword,
        name,
        slug,
        document,
        city,
        address,
        description,
        imageUrl,
        phones,
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

      if (!login?.ok) {
        toast.success("Barbearia criada! Entre com seu e-mail e senha.")
        router.push("/entrar")
        return
      }

      toast.success("Barbearia criada! Abrindo o painel...")
      router.push("/dashboard")
      router.refresh()
    })

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Seus dados
        </h2>

        <Field id="cad-dono" label="Seu nome *">
          <Input
            id="cad-dono"
            autoComplete="name"
            maxLength={80}
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
          />
        </Field>

        <Field id="cad-email" label="E-mail *">
          <Input
            id="cad-email"
            type="email"
            autoComplete="email"
            maxLength={120}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Você vai usar este e-mail e a senha abaixo para entrar no painel.
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cad-senha" label="Senha *">
            <Input
              id="cad-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field id="cad-senha2" label="Confirme a senha *">
            <Input
              id="cad-senha2"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>
        </div>

        <Field id="cad-dono-tel" label="Seu telefone com WhatsApp *">
          <Input
            id="cad-dono-tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            value={ownerPhone}
            onChange={(event) => setOwnerPhone(event.target.value)}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Sua barbearia
        </h2>

        <Field id="cad-nome" label="Nome da barbearia *">
          <Input
            id="cad-nome"
            maxLength={80}
            value={name}
            onChange={(event) => changeName(event.target.value)}
          />
        </Field>

        <Field id="cad-endereco-url" label="Endereço da sua página *">
          <div className="flex items-center gap-2">
            <Input
              id="cad-endereco-url"
              maxLength={50}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="minha-barbearia"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true)
                setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))
              }}
            />
            {rootDomain && (
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                .{rootDomain}
              </span>
            )}
          </div>
          <p
            role="status"
            className={
              slugStatus.state === "invalid"
                ? "text-destructive text-xs"
                : slugStatus.state === "available"
                  ? "text-xs text-emerald-600"
                  : "text-muted-foreground text-xs"
            }
          >
            {slugStatus.state === "checking" && "Verificando..."}
            {slugStatus.state === "available" && "Endereço disponível."}
            {slugStatus.state === "invalid" && slugStatus.message}
            {slugStatus.state === "idle" &&
              "É o endereço que seus clientes vão usar para agendar."}
          </p>
        </Field>

        <Field id="cad-documento" label="CPF ou CNPJ" optional>
          <Input
            id="cad-documento"
            inputMode="numeric"
            maxLength={18}
            placeholder="00.000.000/0000-00"
            value={document}
            onChange={(event) => setDocument(event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Field id="cad-cidade" label="Cidade *">
              <Input
                id="cad-cidade"
                maxLength={80}
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="cad-endereco" label="Endereço completo *">
              <Input
                id="cad-endereco"
                maxLength={160}
                placeholder="Rua, número, bairro"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </Field>
          </div>
        </div>

        <Field id="cad-descricao" label="Sobre a barbearia *">
          <Textarea
            id="cad-descricao"
            rows={3}
            maxLength={600}
            placeholder="Conte em uma ou duas frases o que você oferece."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">
            Telefones da barbearia com WhatsApp *
          </p>
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(event) => setPhone(index, event.target.value)}
              />
              {phones.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remover telefone"
                  onClick={() =>
                    setPhones((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2Icon />
                </Button>
              )}
            </div>
          ))}
          {phones.length < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPhones((current) => [...current, ""])}
            >
              <PlusIcon /> Adicionar telefone
            </Button>
          )}
        </div>

        <Field id="cad-imagem" label="Foto da barbearia" optional>
          <ImageUploadField value={imageUrl} onChange={setImageUrl} />
        </Field>
      </section>

      <Button
        className="w-full"
        onClick={enviar}
        disabled={isSaving || slugStatus.state === "checking"}
      >
        {isSaving ? "Criando..." : "Criar minha barbearia"}
      </Button>
    </div>
  )
}

export default SignupForm
