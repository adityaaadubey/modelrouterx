import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import SiteLayout from '@/components/site-layout'
import './globals.css'
import './modelrouterx.css'

export const metadata = {
  title: 'ModelRouterX — Independent Model Intelligence',
  description: 'Compare foundation models using attributed benchmarks, live capabilities, context windows, and transparent pricing.',
  generator: 'ModelRouterX',
  applicationName: 'ModelRouterX',
  keywords: ['AI models', 'model benchmarks', 'LLM pricing', 'model comparison', 'Artificial Analysis'],
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    title: 'ModelRouterX — Independent Model Intelligence',
    description: 'Find the signal. Route with evidence.',
    siteName: 'ModelRouterX',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export async function generateViewport() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('mrx-theme')?.value === 'light' ? 'light' : 'dark'

  return {
    colorScheme: theme,
    themeColor: theme === 'light' ? '#efe4cc' : '#0b0819',
  }
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const theme = cookieStore.get('mrx-theme')?.value === 'light' ? 'light' : 'dark'

  return (
    <html lang="en" data-theme={theme}>
      <body className="mrx-body">
        <SiteLayout theme={theme}>{children}</SiteLayout>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
