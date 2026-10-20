import Link from "next/link"
import { TryDemoButton } from "./try-demo-button"

export function FinalCta() {
  return (
    <section className="mt-20 md:mt-[120px] rounded-[14px] px-6 py-10 md:px-16 md:py-[72px] flex flex-wrap items-center justify-between gap-8 bg-[#15181D] text-[#F3F4F1] dark:bg-card dark:border dark:border-border dark:text-foreground">
      <div className="max-w-[560px]">
        <h2 className="text-[36px] md:text-[56px] leading-none font-bold tracking-[-0.045em] max-w-[560px]">
          Start your first chain today.
        </h2>
        <p className="mt-5 text-[17px] md:text-[19px] leading-[1.45] text-[#C3C7CC] dark:text-text-soft max-w-[480px]">
          Create an account, add a habit, tap today&apos;s square. That is the
          whole setup.
        </p>
      </div>

      <div className="flex flex-col items-center sm:items-start gap-2.5 shrink-0">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center h-[52px] px-7 rounded-[10px] text-[16px] font-semibold bg-[#F3F4F1] text-[#15181D] hover:opacity-90 dark:bg-primary dark:text-primary-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Create your account
        </Link>
        <TryDemoButton variant="link" />
      </div>
    </section>
  )
}
