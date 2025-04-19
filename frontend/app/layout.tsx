import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/toaster"
import IssueMatchAI from "@/components/issue-match-ai"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Open Source Contribution Matchmaker",
  description: "Find the perfect open source issues to contribute to based on your skills and interests",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0d1117] text-white`} suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
          <IssueMatchAI />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}