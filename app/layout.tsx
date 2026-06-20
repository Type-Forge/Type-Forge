import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { ThemeProvider } from "@/components/providers/ThemeProvider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "TypeForge — Typing Speed Trainer",
  description: "A minimalist, premium typing trainer built with precision. Improve your speed, accuracy, and consistency.",
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
          {/* Top persistent navigation bar */}
          <Navbar />

          {/* Main Layout Content */}
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
