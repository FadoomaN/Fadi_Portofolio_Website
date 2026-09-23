import Link from 'next/link';

export default function SiteFooter() {
  return <footer className="site-footer">
    <div><strong>Fadi Al Hazim</strong><span>Computer Engineer</span></div>
    <nav aria-label="Footer navigation"><Link href="/projects">Projects</Link><Link href="/journey">Journey</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav>
    <small>© {new Date().getFullYear()} Fadi Al Hazim</small>
  </footer>;
}
