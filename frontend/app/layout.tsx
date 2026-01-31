import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CyberXperience 2026 - The Shell Chronicles',
  description: 'A beginner-friendly CTF challenge featuring path traversal, command injection, and privilege escalation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-terminal-bg text-terminal-fg font-mono">
        {children}
      </body>
    </html>
  )
}
