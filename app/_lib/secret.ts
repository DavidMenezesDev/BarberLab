import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto"

// Cifra credenciais guardadas no banco (AES-256-GCM, chave derivada do
// NEXTAUTH_SECRET). Trocar o segredo invalida o que já foi salvo.
const key = () => {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado.")
  return createHash("sha256").update(secret).digest()
}

export const encryptSecret = (plain: string) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key(), iv)
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString("base64"))
    .join(".")
}

export const decryptSecret = (payload: string) => {
  const [iv, tag, data] = payload
    .split(".")
    .map((part) => Buffer.from(part, "base64"))
  const decipher = createDecipheriv("aes-256-gcm", key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  )
}
