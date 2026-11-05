"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

const ENDPOINT = "/api/analytics"
const VISITOR_KEY = "bl_vid"
const SESSION_KEY = "bl_sid"
const IGNORED = ["/master", "/api"]

const randomId = () =>
  (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  ).slice(0, 64)

const readStore = (store: Storage, key: string) => {
  try {
    let value = store.getItem(key)
    if (!value) {
      value = randomId()
      store.setItem(key, value)
    }
    return value
  } catch {
    return randomId()
  }
}

const getIds = () => {
  const visitorId = readStore(localStorage, VISITOR_KEY)
  // O servidor lê este cookie para atribuir cadastros e agendamentos ao visitante.
  document.cookie = `${VISITOR_KEY}=${visitorId}; path=/; max-age=31536000; SameSite=Lax`
  return { visitorId, sessionId: readStore(sessionStorage, SESSION_KEY) }
}

type Payload = {
  type: "PAGEVIEW" | "CLICK" | "EVENT"
  name?: string
  props?: Record<string, string | number | boolean>
}

const send = (payload: Payload) => {
  if (navigator.doNotTrack === "1") return
  const path = window.location.pathname
  if (IGNORED.some((prefix) => path.startsWith(prefix))) return

  const params = new URLSearchParams(window.location.search)
  const body = JSON.stringify({
    ...payload,
    ...getIds(),
    path,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  })

  const blob = new Blob([body], { type: "application/json" })
  if (!navigator.sendBeacon?.(ENDPOINT, blob)) {
    fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {})
  }
}

const describeClick = (target: Element) => {
  const el = target.closest<HTMLElement>(
    "[data-track], a, button, [role=button]",
  )
  if (!el) return null

  const label =
    el.dataset.track ||
    el.getAttribute("aria-label") ||
    el.textContent?.replace(/\s+/g, " ").trim() ||
    el.getAttribute("href") ||
    ""
  if (!label) return null

  const props: Record<string, string> = { tag: el.tagName.toLowerCase() }
  const href = el.getAttribute("href")
  if (href) props.href = href.slice(0, 200)

  return { name: label.slice(0, 80), props }
}

const AnalyticsTracker = () => {
  const pathname = usePathname()

  useEffect(() => {
    send({ type: "PAGEVIEW" })
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const click = describeClick(event.target)
      if (click) send({ type: "CLICK", ...click })
    }

    document.addEventListener("click", onClick, { capture: true })
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  return null
}

export default AnalyticsTracker
