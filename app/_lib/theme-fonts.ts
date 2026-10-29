import {
  Bebas_Neue,
  DM_Serif_Display,
  Inter,
  Inter_Tight,
  Lora,
  Montserrat,
  Oswald,
  Playfair_Display,
  Poppins,
  Roboto_Slab,
  Space_Grotesk,
} from "next/font/google"
import type { ThemeFontKey } from "./theme"

// O next/font só aceita opções literais em cada chamada (sem const ou spread).
// preload: false evita baixar a fonte em páginas que não a usam.

const inter = Inter({ subsets: ["latin"], preload: false })
const interTight = Inter_Tight({ subsets: ["latin"], preload: false })
const montserrat = Montserrat({ subsets: ["latin"], preload: false })
const poppins = Poppins({
  subsets: ["latin"],
  preload: false,
  weight: ["400", "500", "600", "700"],
})
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], preload: false })
const oswald = Oswald({ subsets: ["latin"], preload: false })
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  preload: false,
  weight: "400",
})
const playfair = Playfair_Display({ subsets: ["latin"], preload: false })
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  preload: false,
  weight: "400",
})
const lora = Lora({ subsets: ["latin"], preload: false })
const robotoSlab = Roboto_Slab({ subsets: ["latin"], preload: false })

const FONT_FAMILIES: Record<ThemeFontKey, string> = {
  inter: `${inter.style.fontFamily}, system-ui, sans-serif`,
  "inter-tight": `${interTight.style.fontFamily}, Arial, sans-serif`,
  montserrat: `${montserrat.style.fontFamily}, system-ui, sans-serif`,
  poppins: `${poppins.style.fontFamily}, system-ui, sans-serif`,
  "space-grotesk": `${spaceGrotesk.style.fontFamily}, system-ui, sans-serif`,
  oswald: `${oswald.style.fontFamily}, Arial Narrow, sans-serif`,
  "bebas-neue": `${bebasNeue.style.fontFamily}, Impact, sans-serif`,
  "playfair-display": `${playfair.style.fontFamily}, Georgia, serif`,
  "dm-serif-display": `${dmSerif.style.fontFamily}, Georgia, serif`,
  lora: `${lora.style.fontFamily}, Georgia, serif`,
  "roboto-slab": `${robotoSlab.style.fontFamily}, Georgia, serif`,
}

export const fontFamilyFor = (key: ThemeFontKey) => FONT_FAMILIES[key]
