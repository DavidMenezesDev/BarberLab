import { cn } from "@/app/_lib/utils"

interface LogoProps {
  className?: string
}

// Mesma identidade do EliteSales: marca em gradiente coral + wordmark Inter Tight
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
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M8.12 8.12 12 12" />
          <path d="M20 4 8.12 15.88" />
          <path d="M14.8 14.8 20 20" />
        </svg>
      </span>
      <span>
        BarberLab<span className="text-[#f84f39]">.</span>
      </span>
    </span>
  )
}

export default Logo
