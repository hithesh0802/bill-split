import './globals.css'
import Navbar from '@/components/Navbar'
import { ReactNode } from 'react'
import { Providers } from "./providers";

export const metadata = {
  title: 'Bill Split',
  description: 'Split your expenses easily!',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
      <Providers>
        <Navbar />
        <main className="p-8">{children}</main>
      </Providers>
      </body>
    </html>
  )
}
