import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import SiteLayout from '@/components/site-layout'
import './globals.css'
import './theme-tokens.css'
import './modelrouterx.css'

const themeInitScript = `(() => {
  const root = document.documentElement;
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('veyralabs_theme'); } catch {}
  const theme = savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  root.dataset.theme = theme;
  root.className = theme;
  root.style.colorScheme = theme;
  const colorScheme = document.getElementById('mrx-color-scheme');
  if (colorScheme) colorScheme.content = theme;
  const setThemeColor = () => {
    const page = getComputedStyle(root).getPropertyValue('--page').trim();
    const themeColor = document.getElementById('mrx-theme-color');
    if (page && themeColor) themeColor.content = page;
  };
  requestAnimationFrame(setThemeColor);
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = 'mrx-theme=' + theme + '; Path=/; Max-Age=31536000; SameSite=Lax' + secure;
})();`

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

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const theme = cookieStore.get('mrx-theme')?.value === 'light' ? 'light' : 'dark'

  return (
    <html lang="en" data-theme={theme} className={theme} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta id="mrx-theme-color" name="theme-color" content="" />
        <meta id="mrx-color-scheme" name="color-scheme" content={theme} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="mrx-body">
        <SiteLayout theme={theme}>{children}</SiteLayout>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
