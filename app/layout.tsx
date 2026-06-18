import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Logo from "@/components/ui/Logo"
import ThemeToggle from "@/components/ui/ThemeToggle"
import Footer from "@/components/ui/Footer"
import Link from "next/link"
import { ThemeProvider } from "@/components/providers/ThemeProvider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text-primary transition-colors duration-150">
        <ThemeProvider>
          {/* Glassmorphic Fixed Navbar */}
          <nav className="fixed top-0 left-0 right-0 z-50 apple-navbar">
            <div className="mx-auto max-w-4xl flex items-center justify-between h-16 px-6">
              {/* Logo left */}
              <Logo />

              {/* Navigation links & theme toggle right */}
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent
                             text-text-muted hover:text-text-secondary hover:bg-surface-hover
                             transition-colors duration-150 active:scale-[0.97] cursor-pointer"
                  aria-label="View Profile"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </nav>
          
          {/* Main Layout Content - Offset by fixed nav height */}
          <main className="flex-1 flex flex-col pt-16 pb-8">
            {children}
          </main>

          {/* Clean minimal footer */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
