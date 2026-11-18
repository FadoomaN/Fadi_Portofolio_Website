'use client';

import { usePathname } from 'next/navigation';
import type { FooterSettings } from '@/lib/footer';

const hiddenPrefixes = ['/admin', '/login', '/authenticator', '/reset-password', '/api'];

export default function SiteFooter({ settings }: { settings: FooterSettings | null }) {
  const pathname = usePathname();
  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) return null;
  const links = (settings?.links ?? []).filter((link) => link.enabled);
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <div className="site-footer-identity"><strong>Fadi Al Hazim</strong><small>Computer Engineer / Creative Developer</small></div>
      {links.length > 0 && <nav aria-label="Social and profile links">{links.map((link) => <a href={link.url} target={link.newTab ? '_blank' : undefined} rel={link.newTab ? 'noreferrer' : undefined} key={link.id}><b aria-hidden="true">{link.icon}</b>{link.label}<i aria-hidden="true">↗</i></a>)}</nav>}
      <div className="site-footer-legal"><span>© {new Date().getFullYear()} Fadi Al Hazim. All rights reserved.</span><span>Built with care.</span></div>
    </div>
  </footer>;
}
