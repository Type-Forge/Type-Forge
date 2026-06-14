import type { Metadata } from "next"
import { Inter, Manrope, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Logo from "@/components/ui/Logo"
import ThemeToggle from "@/components/ui/ThemeToggle"
import Footer from "@/components/ui/Footer"
import Link from "next/link"
import { ThemeProvider } from "@/components/providers/ThemeProvider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "Turing Type — Bletchley Decryption Game",
  description: "Decode substitution ciphers at Bletchley Park. An ode to Alan Turing.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <ThemeProvider>
          {/* Header Navigation */}
          <header className="w-full py-4 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 md:px-8 flex justify-between items-center">
              <Logo />
              <nav className="flex items-center gap-6">
                <Link
                  href="/battle"
                  className="text-sm font-heading font-semibold tracking-wide text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Race Enigma
                </Link>
                <ThemeToggle />
              </nav>
            </div>
          </header>
          
          {/* Main Layout Area */}
          <main className="flex-1 flex flex-col py-8">
            {children}
          </main>

          {/* Footer Component */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
