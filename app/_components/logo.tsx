import { cn } from "@/app/_lib/utils"

interface LogoProps {
  className?: string
}

// Mesma identidade do SalaoElite (Landing-page/apps/salaoelite): marca em gradiente coral + wordmark Inter Tight
const Logo = ({ className }: LogoProps) => {
  return (
    <span
      className={cn(
        "font-display text-foreground inline-flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.035em]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-[9px] bg-gradient-to-br from-[#ff6a4f] to-[#f84f39] text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[19px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="7.5" cy="7" r="2.6" />
          <circle cx="7.5" cy="17" r="2.6" />
          <path d="m9.6 8.6 9.4 7M9.6 15.4 19 8.4" />
        </svg>
      </span>
      <span>
        SalaoElite<span className="text-[#f84f39]">.</span>
      </span>
    </span>
  )
}

export default Logo
