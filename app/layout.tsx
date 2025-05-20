import './globals.css'
import { Inter } from 'next/font/google'
import { UserProvider } from '@/context/UserContext'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SmartCart',
  description: 'Your e‑commerce platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <Suspense>
            {children}
          </Suspense>
        </UserProvider>
      </body>
    </html>
  )
}
