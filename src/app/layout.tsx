import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import { getSession } from "@/lib/auth"
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

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
              <div className="flex items-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto">
                {session ? (
                  <>
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      Dashboard
                    </Link>
                    <Link href="/calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      CRS
                    </Link>
                    <Link href="/eligibility" className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      Eligibility
                    </Link>
                    <Link href="/checklist" className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      Docs
                    </Link>
                    <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                      Settings
                    </Link>
                    <div className="hidden sm:flex items-center gap-3 pl-3 border-l">
                      <span className="text-sm text-muted-foreground">{session.name.split(" ")[0]}</span>
                      <LogoutButton />
                    </div>
                    <div className="sm:hidden">
                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
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

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server"
        const { destroySession } = await import("@/lib/auth")
        await destroySession()
        const { redirect } = await import("next/navigation")
        redirect("/login")
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-500 hover:text-red-600 transition-colors whitespace-nowrap"
      >
        Logout
      </button>
    </form>
  )
}
