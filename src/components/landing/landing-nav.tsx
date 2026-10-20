import Link from "next/link"
import { APP_NAME } from "@/lib/brand"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingNav() {
  return (
    <header className="w-full">
      <div className="max-w-[1040px] mx-auto px-4 sm:px-8">
        <div className="h-[60px] md:h-[72px] flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-[20px] font-bold tracking-[-0.02em] text-foreground"
            >
              {APP_NAME}
            </Link>
            <nav aria-label="Landing" className="hidden md:flex items-center gap-[24px] ml-[40px] select-none">
              <a
                href="#how-it-works"
                className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
              >
                How it works
              </a>
              <a
                href="#features"
                className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
              >
                Features
              </a>
              <a
                href="#faq"
                className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
              >
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <Link
              href="/login"
              className="relative inline-flex items-center min-h-[44px] md:min-h-0 text-[15px] font-semibold text-foreground hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-9 px-4 md:h-10 md:px-[18px] rounded-[10px] bg-primary text-primary-foreground text-[15px] font-semibold hover:opacity-90 transition-opacity relative after:size-[44px] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 md:after:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
