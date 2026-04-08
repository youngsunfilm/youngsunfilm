import './globals.css'
import {IBM_Plex_Mono, Inter, PT_Serif, Geist } from 'next/font/google'
import { cn } from "@/lib/utils";

const serif = PT_Serif({
  variable: '--font-serif',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['400', '700'],
})
const geist = Geist({subsets:['latin'],variable:'--font-sans'})
const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500', '700'],
})

export default async function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn(mono.variable, serif.variable, "font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
