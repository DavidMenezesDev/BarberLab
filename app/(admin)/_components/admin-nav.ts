import {
  CalendarRangeIcon,
  LayoutDashboardIcon,
  ScissorsIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

export const ADMIN_NAV_ITEMS = [
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
    href: "/settings",
    tour: "tour-settings",
    ownerOnly: true,
    label: "Configurações",
    shortLabel: "Ajustes",
    icon: SettingsIcon,
  },
] as const

export const navItemsFor = (isOwner: boolean) =>
  ADMIN_NAV_ITEMS.filter((item) => isOwner || !("ownerOnly" in item))
