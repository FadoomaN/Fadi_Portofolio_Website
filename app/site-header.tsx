import HeaderControls from './header-controls';
import SecretBrand from './secret-brand';
import { navigationItems, siteContent } from './site-content';

export default function SiteHeader({
  homeIsCurrent = false,
  revealImmediately = false,
  activeHref,
}: {
  homeIsCurrent?: boolean;
  revealImmediately?: boolean;
  activeHref?: string;
}) {
  return (
    <header className={`engineering-header${revealImmediately ? ' is-immediate' : ''}`}>
      <SecretBrand label={siteContent.brand} />

      <nav className="header-nav" aria-label="Primary navigation">
        {navigationItems.map((item) => item.disabled ? (
          <span
            className="nav-link nav-link-disabled"
            aria-disabled="true"
            title="Coming soon"
            key={item.href}
          >
            <span className="nav-index">{item.index}</span>
            <span className="nav-label">{item.label}</span>
            <small>Soon</small>
          </span>
        ) : (
          <a
            className={`nav-link${item.current ? ' nav-home' : ''}`}
            href={item.href}
            aria-current={(homeIsCurrent && item.current) || activeHref === item.href ? 'page' : undefined}
            key={item.href}
          >
            {item.current ? (
              <span className="home-icon" aria-hidden="true" />
            ) : (
              <span className="nav-index">{item.index}</span>
            )}
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>

      <HeaderControls homeIsCurrent={homeIsCurrent} activeHref={activeHref} />
    </header>
  );
}
