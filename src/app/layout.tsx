import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "IRCC Tracker - Express Entry & PR Dashboard",
  description: "Track Express Entry draws, calculate your CRS score, and get notified about new immigration updates for Canadian PR.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}>
        <nav className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-2xl">🍁</span>
                  <span className="font-bold text-xl text-primary">IRCC Tracker</span>
                </Link>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/calculator"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  CRS Calculator
                </Link>
                <Link
                  href="/eligibility"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Eligibility
                </Link>
                <Link
                  href="/checklist"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Documents
                </Link>
                <Link
                  href="/settings"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
