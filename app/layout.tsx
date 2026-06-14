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
  title: "Turing Type — Decryption Speed Trainer",
  description: "Minimalist typing trainer game themed around Bletchley ciphers. An ode to Alan Turing.",
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
      <body className="min-h-full flex flex-col bg-bg text-text-primary transition-colors duration-150">
        <ThemeProvider>
          {/* Glassmorphic Fixed Navbar */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-xl">
            <div className="mx-auto max-w-3xl flex items-center justify-between h-14 px-6">
              {/* Logo left */}
              <Logo />

              {/* Navigation links & theme toggle right */}
              <div className="flex items-center gap-6">
                <Link
                  href="/battle"
                  className="text-sm font-heading font-medium tracking-wide text-text-secondary hover:text-text-primary transition-colors duration-150 cursor-pointer"
                >
                  Battle
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </nav>
          
          {/* Main Layout Content - Offset by fixed nav height */}
          <main className="flex-1 flex flex-col pt-14 pb-8">
            {children}
          </main>

          {/* Clean minimal footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
