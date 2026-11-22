import { Analytics } from '@vercel/analytics/next'
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

export const viewport = {
  colorScheme: 'dark',
  themeColor: '#08090b',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="mrx-body">
        <SiteLayout>{children}</SiteLayout>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
