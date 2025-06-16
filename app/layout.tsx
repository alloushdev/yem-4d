import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "تطبيق دردشة بسيط",
  description: "تم إنشاؤه بواسطة Next.js",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>{children}</body>
    </html>
  )
}


import './globals.css'