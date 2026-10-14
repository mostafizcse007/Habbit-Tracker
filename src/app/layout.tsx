import type { Metadata } from "next"
import { Bricolage_Grotesque } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  fallback: ["system-ui"],
  axes: ["opsz"],
})

export const metadata: Metadata = {
  title: "Habit Tracker",
  description:
    "Track your daily habits, build streaks, and achieve your consistency goals.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolageGrotesque.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
