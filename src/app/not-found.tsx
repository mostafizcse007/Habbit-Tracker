import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <h1 className="text-4xl sm:text-[56px] font-bold tracking-tight text-foreground leading-tight">
        Page not found
      </h1>
      <p className="text-[16px] text-muted-foreground mt-4 max-w-[480px]">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8">
        <Link href="/dashboard" className={buttonVariants()}>
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
