import { Analytics } from '@vercel/analytics/next'
import { cookies } from 'next/headers'
import Script from 'next/script'
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
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  root.style.colorScheme = theme;
  const colorScheme = document.getElementById('mrx-color-scheme');
  if (colorScheme) colorScheme.content = theme;
  const syncThemeMetadata = () => {
    const activeTheme = root.dataset.theme;
    const page = getComputedStyle(root).getPropertyValue('--page').trim();
    let colorSchemes = document.querySelectorAll('meta[name="color-scheme"]');
    let themeColors = document.querySelectorAll('meta[name="theme-color"]');

    if (!colorSchemes.length) {
      const meta = document.createElement('meta');
      meta.name = 'color-scheme';
      document.head.appendChild(meta);
      colorSchemes = document.querySelectorAll('meta[name="color-scheme"]');
    }

    if (!themeColors.length) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
      themeColors = document.querySelectorAll('meta[name="theme-color"]');
    }

    colorSchemes.forEach((meta) => { meta.content = activeTheme; });
    if (page) themeColors.forEach((meta) => { meta.content = page; });
  };
  syncThemeMetadata();
  requestAnimationFrame(syncThemeMetadata);
  new MutationObserver(syncThemeMetadata).observe(document.head, { childList: true });
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = 'mrx-theme=' + theme + '; Path=/; Max-Age=31536000; SameSite=Lax' + secure;
})();`

export const metadata = {
  title: { default: 'Arena Signal — AI model rankings', template: '%s · Arena Signal' },
  description: 'Explore source-published Arena rankings, flip through model cards, and compare labs. Independent project using the public LMArena leaderboard dataset.',
  generator: 'Arena Signal',
  applicationName: 'Arena Signal',
  keywords: ['AI model rankings', 'Arena leaderboard', 'model comparison', 'AI labs'],
  icons: { icon: '/brand/arena-signal.svg', shortcut: '/brand/arena-signal.svg' },
  openGraph: {
    title: 'Arena Signal — AI model rankings',
    description: 'Explore public Arena model rankings and compare models within the same track.',
    siteName: 'Arena Signal',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const theme = cookieStore.get('mrx-theme')?.value === 'light' ? 'light' : 'dark'

  return (
    <html lang="en" data-theme={theme} className={theme} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head />
      <body className="mrx-body">
        <SiteLayout theme={theme}>{children}</SiteLayout>
        <Script id="mrx-theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
