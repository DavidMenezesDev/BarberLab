import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const TAMANHO_DA_CHAVE = 64
export const TAMANHO_MINIMO_DA_SENHA = 8

const derivar = (senha: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(senha, salt, TAMANHO_DA_CHAVE, (erro, chave) =>
      erro ? reject(erro) : resolve(chave),
    ),
  )

export const hashPassword = async (senha: string) => {
  const salt = randomBytes(16)
  const chave = await derivar(senha, salt)
  return `scrypt:${salt.toString("base64")}:${chave.toString("base64")}`
}

export const verifyPassword = async (senha: string, hash: string | null) => {
  if (!hash) return false

  const [formato, salt, chave] = hash.split(":")
  if (formato !== "scrypt" || !salt || !chave) return false

  const esperado = Buffer.from(chave, "base64")
  const obtido = await derivar(senha, Buffer.from(salt, "base64"))

  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido)
}
