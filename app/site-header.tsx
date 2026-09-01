import HeaderControls from './header-controls';
import SecretBrand from './secret-brand';
import { navigationItems, siteContent } from './site-content';

export default function SiteHeader({
  homeIsCurrent = false,
  revealImmediately = false,
}: {
  homeIsCurrent?: boolean;
  revealImmediately?: boolean;
}) {
  return (
    <header className={`engineering-header${revealImmediately ? ' is-immediate' : ''}`}>
      <SecretBrand label={siteContent.brand} />

      <nav className="header-nav" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <a
            className={`nav-link${item.current ? ' nav-home' : ''}`}
            href={item.href}
            aria-current={homeIsCurrent && item.current ? 'page' : undefined}
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

      <HeaderControls homeIsCurrent={homeIsCurrent} />
    </header>
  );
}
