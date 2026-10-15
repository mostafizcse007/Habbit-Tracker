interface Step {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Add your habits",
    description:
      "Name them, pick a color and the days they happen. Reorder them whenever you like.",
  },
  {
    number: "02",
    title: "Tap a square each day",
    description:
      "One tap checks a day off. Forgot yesterday? Fill it in from the habit's own calendar.",
  },
  {
    number: "03",
    title: "Watch the chain grow",
    description:
      "Streaks, charts and a weekly written review show you what is working.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 pt-20 md:pt-[120px]">
      <h2 className="text-[32px] md:text-[44px] leading-none font-bold tracking-[-0.04em] text-foreground">
        How it works
      </h2>

      <div className="mt-7 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {STEPS.map((step) => (
          <div key={step.number} className="border-t-2 border-foreground pt-5">
            <div className="text-[14px] font-semibold text-muted-foreground">
              {step.number}
            </div>
            <h3 className="mt-2.5 text-[24px] font-bold tracking-[-0.02em] leading-[1.15] text-foreground">
              {step.title}
            </h3>
            <p className="mt-2.5 text-[16px] leading-[1.5] text-text-soft">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
