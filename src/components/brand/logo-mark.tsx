interface LogoMarkProps {
  size?: number
  className?: string
  "aria-hidden"?: boolean
}

export function LogoMark({
  size = 28,
  className,
  "aria-hidden": ariaHidden = true,
}: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <rect width="20" height="20" rx="4.4" fill="#15181D" />
      <path
        d="M4.5 10.5l3.5 3.5 7.5-8"
        stroke="#FFE45C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
