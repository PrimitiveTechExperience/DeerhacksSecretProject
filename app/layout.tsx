import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { UserThemeSync } from '@/components/theme/user-theme-sync'
import { AuthProvider } from '@/components/auth/auth-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ContinuLearn',
  description: 'AI-powered voice tutor for continuum robots. Learn robot kinematics interactively with real-time simulation and intelligent coaching.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/Unity/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/Unity/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/Unity/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/Unity/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e5dbc9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1629' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserThemeSync />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
