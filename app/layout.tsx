import type { Metadata } from 'next';
import './globals.css';
import SiteFooter from './site-footer';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeFooterLinks, type FooterSettings } from '@/lib/footer';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Fadi Al Hazim — Portfolio',
  description: 'The portfolio of Fadi Al Hazim, creative developer in Sweden.',
  openGraph: {
    title: 'Fadi Al Hazim — Portfolio',
    description: 'Creative developer in Sweden.',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Fadi Al Hazim — Creative Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fadi Al Hazim — Portfolio',
    description: 'Creative developer in Sweden.',
    images: ['/og.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let footer: FooterSettings | null = null;
  try {
    const db = await createServerSupabaseClient();
    const { data } = await db.from('site_footer_settings').select('id, links, updated_at').eq('id', 1).maybeSingle();
    if (data) footer = { id: data.id, links: normalizeFooterLinks(data.links), updated_at: data.updated_at };
  } catch {
    footer = null;
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement;var m=localStorage.getItem('portfolio-theme');m=m==='dark'||m==='light'?m:'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.theme=d?'dark':'light';r.dataset.themeMode=m;if(location.pathname==='/'){var k='portfolio-home-intro-seen';var s=sessionStorage.getItem(k);r.dataset.homeIntro=s?'seen':'show';if(!s)sessionStorage.setItem(k,'1');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}<SiteFooter settings={footer} /></body>
    </html>
  );
}
