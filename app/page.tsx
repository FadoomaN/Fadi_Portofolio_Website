import HeaderControls from './header-controls';
import { navigationItems, siteContent } from './site-content';

export default function Home() {
  return (
    <main className="blank-canvas">
      <header className="engineering-header">
        <a className="header-brand" href="#" aria-label="Fadi Al Hazim, home">
          <span className="brand-mark" aria-hidden="true" />
          <span>{siteContent.brand}</span>
        </a>

        <nav className="header-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <a
              className={`nav-link${item.current ? ' nav-home' : ''}`}
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
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

        <HeaderControls />
      </header>

      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-zone" aria-hidden="true" />

        <div className="hero-copy">
          <p className="hero-kicker">
            <span>{siteContent.profile.kicker}</span>
            <span className="hero-kicker-line" aria-hidden="true" />
          </p>

          <h1 id="hero-title">
            <span>{siteContent.profile.firstName}</span>
            <span>{siteContent.profile.lastName}</span>
          </h1>

          <div className="hero-role">
            <span className="role-line" aria-hidden="true" />
            <p>{siteContent.profile.role}</p>
          </div>
        </div>

        <figure className="hero-portrait">
          <span className="portrait-frame portrait-frame-top" aria-hidden="true" />
          <div className="portrait-window">
            {/* Vinext's current Next Image shim crashes during local hydration, so keep this native. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteContent.profile.portrait.src} alt={siteContent.profile.portrait.alt} />
          </div>
          <span className="portrait-frame portrait-frame-bottom" aria-hidden="true" />
        </figure>

        <div className="circuit-divider" aria-hidden="true">
          <span className="circuit-rail" />
          <span className="circuit-chip" />
          <span className="circuit-trace circuit-trace-a" />
          <span className="circuit-trace circuit-trace-b" />
          <span className="circuit-trace circuit-trace-c" />
          <span className="circuit-trace circuit-trace-d" />
          <span className="circuit-trace circuit-trace-e" />
          <span className="circuit-trace circuit-trace-f" />
          <span className="circuit-node circuit-node-a" />
          <span className="circuit-node circuit-node-b" />
          <span className="circuit-node circuit-node-c" />
          <span className="circuit-node circuit-node-d" />
          <span className="circuit-node circuit-node-e" />
          <span className="circuit-node circuit-node-f" />
        </div>
      </section>

      <section className="intro" aria-label="Fadi Al Hazim">
        <div className="intro-scene">
          <div className="falling-cube">
            <span className="cube-shine" />
          </div>

          <div className="corner corner-top-left">
            <span className="corner-horizontal" />
            <span className="corner-vertical" />
          </div>

          <div className="corner corner-bottom-right">
            <span className="corner-horizontal" />
            <span className="corner-vertical" />
          </div>

          <h1 className="intro-name">
            <span>{siteContent.profile.firstName}</span>
            <span>{siteContent.profile.lastName}</span>
          </h1>
        </div>
      </section>
    </main>
  );
}
