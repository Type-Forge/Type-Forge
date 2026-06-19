import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Footer from "@/components/ui/Footer"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { Toaster } from "sonner"

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
          {/* Main Layout Content */}
          <main className="flex-1 flex flex-col pt-6 pb-8">
            {children}
          </main>
          
          {/* Clean minimal footer */}
          <Footer />

          {/* Sonner Toaster container for notifications */}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
