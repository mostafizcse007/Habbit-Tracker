import type { Metadata, Viewport } from "next"
import { Bricolage_Grotesque } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE, SITE_URL } from "@/lib/brand"
import "./globals.css"

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  fallback: ["system-ui"],
  axes: ["opsz"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME}: ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    siteName: APP_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1114" },
  ],
  viewportFit: "cover",
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
      data-scroll-behavior="smooth"
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
