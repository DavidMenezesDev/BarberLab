import {
  BuildingIcon,
  CalendarRangeIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  ScissorsIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

export const ADMIN_NAV_ITEMS = [
  {
    href: "/overview",
    tour: "tour-overview",
    multiUnitOnly: true,
    label: "Visão geral",
    shortLabel: "Geral",
    icon: BuildingIcon,
  },
  {
    href: "/dashboard",
    tour: "tour-dashboard",
    label: "Dashboard",
    shortLabel: "Hoje",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/schedule",
    tour: "tour-schedule",
    label: "Agenda",
    shortLabel: "Agenda",
    icon: CalendarRangeIcon,
  },
  {
    href: "/services",
    tour: "tour-services",
    ownerOnly: true,
    label: "Serviços",
    shortLabel: "Serviços",
    icon: ScissorsIcon,
  },
  {
    href: "/barbers",
    tour: "tour-barbers",
    ownerOnly: true,
    label: "Barbeiros",
    shortLabel: "Equipe",
    icon: UsersIcon,
  },
  {
    href: "/financeiro",
    tour: "tour-finance",
    ownerOnly: true,
    label: "Financeiro",
    shortLabel: "Caixa",
    icon: HandCoinsIcon,
  },
  {
    href: "/meus-ganhos",
    tour: "tour-earnings",
    barberOnly: true,
    label: "Meus ganhos",
    shortLabel: "Ganhos",
    icon: HandCoinsIcon,
  },
  {
    href: "/aparencia",
    tour: "tour-appearance",
    ownerOnly: true,
    label: "Personalização",
    shortLabel: "Visual",
    icon: PaletteIcon,
  },
  {
    href: "/settings",
    tour: "tour-settings",
    ownerOnly: true,
    label: "Configurações",
    shortLabel: "Ajustes",
    icon: SettingsIcon,
  },
] as const

export const navItemsFor = (isOwner: boolean, multiUnit = false) =>
  ADMIN_NAV_ITEMS.filter(
    (item) =>
      (isOwner || !("ownerOnly" in item)) &&
      (!isOwner || !("barberOnly" in item)) &&
      (multiUnit || !("multiUnitOnly" in item)),
  )
