import type { WhatsAppProvider } from "@prisma/client"

// Credenciais já decifradas; nunca saem do servidor.
export interface ProviderCredentials {
  provider: WhatsAppProvider
  baseUrl: string
  apiKey: string
  sessionName: string
  instanceToken: string | null
}

export type ConnectionState = "CONNECTED" | "PENDING" | "DISCONNECTED" | "ERROR"

export interface ConnectionStatus {
  state: ConnectionState
  // Imagem do QR code (data URL) enquanto aguarda a leitura.
  qr?: string
  pairCode?: string
  phone?: string
}

export interface StartResult extends ConnectionStatus {
  // O UAZAPI devolve o token da instância ao criá-la; precisa ser guardado.
  instanceToken?: string
}

const TIMEOUT_MS = 15_000

class ProviderError extends Error {}

const request = async <T>(
  credentials: ProviderCredentials,
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: unknown },
): Promise<T> => {
  const url = `${credentials.baseUrl.replace(/\/+$/, "")}${path}`
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(init.body !== undefined && { "Content-Type": "application/json" }),
      ...init.headers,
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  })

  const text = await response.text()
  const data = text ? safeJson(text) : null

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : ""
    throw new ProviderError(
      `${response.status}${detail ? `: ${detail}` : ""}`.slice(0, 200),
    )
  }

  return data as T
}

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const toDataUrl = (value: string | undefined, mime = "image/png") =>
  value
    ? value.startsWith("data:")
      ? value
      : `data:${mime};base64,${value}`
    : undefined

const digits = (value: unknown) =>
  typeof value === "string" ? value.replace(/\D/g, "") || undefined : undefined

export const errorMessage = (error: unknown) =>
  error instanceof ProviderError
    ? `O provedor recusou a chamada (${error.message}).`
    : error instanceof Error && error.name === "TimeoutError"
      ? "O provedor não respondeu a tempo."
      : "Não foi possível falar com o provedor. Confira a URL."

// ---------------------------------------------------------------- WAHA

const wahaHeaders = (c: ProviderCredentials) => ({ "X-Api-Key": c.apiKey })

interface WahaSession {
  status: string
  me?: { id?: string } | null
}

const wahaStatus = async (
  c: ProviderCredentials,
  phone?: string,
): Promise<ConnectionStatus> => {
  const session = await request<WahaSession>(
    c,
    `/api/sessions/${encodeURIComponent(c.sessionName)}`,
    { headers: wahaHeaders(c) },
  )

  if (session.status === "WORKING") {
    return { state: "CONNECTED", phone: digits(session.me?.id?.split("@")[0]) }
  }
  if (session.status === "FAILED") return { state: "ERROR" }
  if (session.status === "STOPPED") return { state: "DISCONNECTED" }

  if (session.status === "SCAN_QR_CODE") {
    if (phone) {
      const code = await request<{ code?: string }>(
        c,
        `/api/${encodeURIComponent(c.sessionName)}/auth/request-code`,
        {
          method: "POST",
          headers: wahaHeaders(c),
          body: { phoneNumber: phone },
        },
      ).catch(() => null)
      if (code?.code) return { state: "PENDING", pairCode: code.code }
    }
    const qr = await request<{ mimetype?: string; data?: string }>(
      c,
      `/api/${encodeURIComponent(c.sessionName)}/auth/qr?format=image`,
      { headers: wahaHeaders(c) },
    ).catch(() => null)
    return { state: "PENDING", qr: toDataUrl(qr?.data, qr?.mimetype) }
  }

  return { state: "PENDING" }
}

const wahaStart = async (
  c: ProviderCredentials,
  phone?: string,
): Promise<StartResult> => {
  const name = encodeURIComponent(c.sessionName)
  try {
    await request(c, "/api/sessions", {
      method: "POST",
      headers: wahaHeaders(c),
      body: { name: c.sessionName, start: true },
    })
  } catch {
    // Sessão já existe: basta iniciá-la (falha sem problema se já estiver ativa).
    await request(c, `/api/sessions/${name}/start`, {
      method: "POST",
      headers: wahaHeaders(c),
    }).catch(() => undefined)
  }
  // A sessão leva um instante para pedir o QR; o painel repete a consulta.
  return wahaStatus(c, phone)
}

// -------------------------------------------------------------- UAZAPI

const uazapiHeaders = (c: ProviderCredentials) => ({
  token: c.instanceToken ?? "",
})

interface UazapiInstance {
  status?: string
  qrcode?: string
  paircode?: string
  owner?: string
}

const uazapiToStatus = (
  instance: UazapiInstance | undefined,
): ConnectionStatus => {
  switch (instance?.status) {
    case "connected":
      return { state: "CONNECTED", phone: digits(instance.owner) }
    case "connecting":
      return {
        state: "PENDING",
        qr: toDataUrl(instance.qrcode),
        pairCode: instance.paircode || undefined,
      }
    default:
      return { state: "DISCONNECTED" }
  }
}

const uazapiStatus = async (c: ProviderCredentials) => {
  const data = await request<{ instance?: UazapiInstance }>(
    c,
    "/instance/status",
    { headers: uazapiHeaders(c) },
  )
  return uazapiToStatus(data.instance)
}

const uazapiStart = async (
  c: ProviderCredentials,
  phone?: string,
): Promise<StartResult> => {
  let instanceToken = c.instanceToken ?? undefined
  if (!instanceToken) {
    const created = await request<{ token?: string }>(c, "/instance/create", {
      method: "POST",
      headers: { admintoken: c.apiKey },
      body: { name: c.sessionName },
    })
    if (!created.token)
      throw new ProviderError("o UAZAPI não devolveu o token da instância")
    instanceToken = created.token
  }

  const authed = { ...c, instanceToken }
  const connected = await request<{
    instance?: UazapiInstance
  }>(authed, "/instance/connect", {
    method: "POST",
    headers: uazapiHeaders(authed),
    body: phone ? { phone } : {},
  })

  return { ...uazapiToStatus(connected.instance), instanceToken }
}

// ----------------------------------------------------------- interface

export const startConnection = (c: ProviderCredentials, phone?: string) =>
  c.provider === "WAHA" ? wahaStart(c, phone) : uazapiStart(c, phone)

export const getConnectionStatus = (c: ProviderCredentials, phone?: string) =>
  c.provider === "WAHA" ? wahaStatus(c, phone) : uazapiStatus(c)

export const disconnect = async (c: ProviderCredentials) => {
  if (c.provider === "WAHA") {
    await request(
      c,
      `/api/sessions/${encodeURIComponent(c.sessionName)}/logout`,
      { method: "POST", headers: wahaHeaders(c) },
    )
  } else {
    await request(c, "/instance/disconnect", {
      method: "POST",
      headers: uazapiHeaders(c),
    })
  }
}

// `phone` já vem normalizado (só dígitos, com DDI).
export const sendText = async (
  c: ProviderCredentials,
  phone: string,
  text: string,
) => {
  if (c.provider === "WAHA") {
    await request(c, "/api/sendText", {
      method: "POST",
      headers: wahaHeaders(c),
      body: { session: c.sessionName, chatId: `${phone}@c.us`, text },
    })
  } else {
    await request(c, "/send/text", {
      method: "POST",
      headers: uazapiHeaders(c),
      body: { number: phone, text },
    })
  }
}
