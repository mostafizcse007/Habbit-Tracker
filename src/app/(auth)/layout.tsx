import Link from "next/link"

const SHEET_ROWS = [
  { color: "#F97316", marks: "DDDDDDD" },
  { color: "#3B82F6", marks: "DDMDDDD" },
  { color: "#10B981", marks: "D-DD-DD" },
]

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#15181D] text-[#F3F4F1] dark:bg-card dark:border-r dark:border-border dark:text-foreground">
        <div>
          <Link
            href="/dashboard"
            className="text-[20px] font-bold tracking-[-0.02em] text-inherit"
          >
            Habit Tracker
          </Link>
        </div>

        <div>
          <h1 className="text-[56px] leading-none font-bold tracking-[-0.045em] max-w-[440px]">
            Small habits, big streaks.
          </h1>

          <div
            className="mt-[40px] relative inline-grid grid-cols-7 gap-[8px]"
            aria-hidden="true"
          >
            <div className="absolute -inset-y-1.5 right-[-6px] w-[48px] rounded-[10px] bg-[rgba(255,214,10,0.14)] z-0" />
            {SHEET_ROWS.map((row, rowIndex) =>
              Array.from(row.marks).map((mark, colIndex) => {
                if (mark === "D") {
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="relative z-10 size-[36px] rounded-[8px] flex items-center justify-center"
                      style={{ backgroundColor: row.color }}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="size-5"
                        fill="none"
                        stroke="#15181D"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                      </svg>
                    </div>
                  )
                }

                if (mark === "M") {
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="relative z-10 size-[36px] rounded-[8px] border-[1.5px] border-white/30 dark:border-line-strong"
                    />
                  )
                }

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="relative z-10 size-[36px] rounded-[8px] flex items-center justify-center"
                  >
                    <div className="w-[10px] h-[2px] bg-white/30 dark:bg-line-strong rounded-full" />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col">
        <div className="lg:hidden px-6 pt-6">
          <Link
            href="/dashboard"
            className="text-[19px] font-bold tracking-[-0.02em] text-foreground"
          >
            Habit Tracker
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
      </div>
    </div>
  )
}
