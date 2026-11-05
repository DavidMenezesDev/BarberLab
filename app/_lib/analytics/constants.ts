export const VISITOR_COOKIE = "bl_vid"

export const EVENT_TYPES = ["PAGEVIEW", "CLICK", "EVENT"] as const
export type AnalyticsEventType = (typeof EVENT_TYPES)[number]

// Nomes dos eventos de negócio gravados pelo servidor.
export const EVENTS = {
  signupCompleted: "signup_completed",
  bookingCreated: "booking_created",
} as const

// Rotas que nunca entram na contagem (painel interno e infraestrutura).
export const IGNORED_PATH_PREFIXES = ["/master", "/api", "/_next"]
