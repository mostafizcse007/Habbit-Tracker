import { LandingNav } from "./landing-nav"
import { Hero } from "./hero"
import { HowItWorks } from "./how-it-works"
import { FinalCta } from "./final-cta"
import { LandingFooter } from "./landing-footer"

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[10px] focus:text-[14px] focus:font-semibold focus:outline-none"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="main" className="max-w-[1040px] mx-auto px-4 sm:px-8 min-w-0">
        <Hero />
        <HowItWorks />
        <div id="features" />
        <div id="faq" />
        <FinalCta />
      </main>

      <div className="max-w-[1040px] mx-auto px-4 sm:px-8">
        <LandingFooter />
      </div>
    </div>
  )
}
