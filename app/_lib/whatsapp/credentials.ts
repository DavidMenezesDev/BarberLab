import type { WhatsAppConnection } from "@prisma/client"
import { decryptSecret } from "../secret"
import type { ProviderCredentials } from "./providers"

export const toCredentials = (
  connection: Pick<
    WhatsAppConnection,
    "provider" | "baseUrl" | "apiKey" | "sessionName" | "instanceToken"
  >,
): ProviderCredentials => ({
  provider: connection.provider,
  baseUrl: connection.baseUrl,
  apiKey: decryptSecret(connection.apiKey),
  sessionName: connection.sessionName,
  instanceToken: connection.instanceToken
    ? decryptSecret(connection.instanceToken)
    : null,
})
