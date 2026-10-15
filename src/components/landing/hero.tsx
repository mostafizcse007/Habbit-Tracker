import Link from "next/link"
import { DemoSheet } from "./demo-sheet"

export function Hero() {
  return (
    <section className="pt-10 md:pt-[72px]">
      <h1 className="text-[44px] md:text-[64px] lg:text-[96px] leading-[0.95] font-bold tracking-[-0.05em] max-w-[880px] text-foreground">
        Small habits,{" "}
        <span
          className="inline-block px-[6px] -mx-[6px]"
          style={{
            background:
              "linear-gradient(transparent 58%, var(--marker) 58%, var(--marker) 92%, transparent 92%)",
          }}
        >
          big streaks.
        </span>
      </h1>

      <p className="mt-7 text-[18px] md:text-[21px] leading-[1.45] text-text-soft max-w-[620px]">
        Track daily habits on a simple week sheet. See your streaks, spot your
        patterns, and get a short written review of your week.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center h-[52px] px-7 rounded-[10px] bg-primary text-primary-foreground text-[16px] font-semibold hover:opacity-90 transition-opacity"
        >
          Start tracking
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex items-center justify-center h-[52px] px-7 rounded-[10px] border border-input text-foreground text-[16px] font-semibold hover:bg-muted transition-colors"
        >
          See how it works
        </a>
      </div>

      <p className="mt-4 text-[14px] text-muted-foreground">
        Free to use. Works in any browser, including your phone.
      </p>

      <div className="mt-10 md:mt-[56px]">
        <DemoSheet />
      </div>
    </section>
  )
}
