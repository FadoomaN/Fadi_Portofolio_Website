'use client';

import { useEffect, useRef, useState } from 'react';
import { navigationItems } from './site-content';

type ThemeMode = 'system' | 'dark' | 'light';
type OpenMenu = 'navigation' | 'theme' | null;

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

function resolveTheme(mode: ThemeMode) {
  if (mode !== 'system') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = resolveTheme(mode);
  document.documentElement.dataset.themeMode = mode;
}

export default function HeaderControls() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
  const navigationOpen = openMenu === 'navigation';
  const themeOpen = openMenu === 'theme';

  useEffect(() => {
    const storedMode = window.localStorage.getItem('portfolio-theme');
    const initialMode: ThemeMode =
      storedMode === 'dark' || storedMode === 'light' ? storedMode : 'system';

    applyTheme(initialMode);
    // Defer the label state until after hydration; the layout script already applies the visual theme.
    const frame = window.requestAnimationFrame(() => setMode(initialMode));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (mode === 'system') applyTheme('system');
    };

    media.addEventListener('change', handleSystemChange);
    return () => media.removeEventListener('change', handleSystemChange);
  }, [mode]);

  useEffect(() => {
    if (!openMenu) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!controlsRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openMenu]);

  const toggleMenu = (menu: Exclude<OpenMenu, null>) => {
    setOpenMenu((currentMenu) => (currentMenu === menu ? null : menu));
  };

  const selectTheme = (selectedMode: ThemeMode) => {
    setMode(selectedMode);
    setOpenMenu(null);
    setIsSwitching(true);
    applyTheme(selectedMode);
    window.localStorage.setItem('portfolio-theme', selectedMode);
    window.setTimeout(() => setIsSwitching(false), 320);
  };

  return (
    <div className="header-controls" ref={controlsRef}>
      <div className="mobile-nav-control">
        <button
          className={`mobile-menu-toggle${navigationOpen ? ' is-open' : ''}`}
          type="button"
          onClick={() => toggleMenu('navigation')}
          aria-label={`${navigationOpen ? 'Close' : 'Open'} navigation menu.`}
          aria-haspopup="menu"
          aria-expanded={navigationOpen}
          aria-controls="mobile-navigation-menu"
        >
          <span className="mobile-menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        {/* Kept mounted so CSS can animate both opening and closing states. */}
        <nav
          className="mobile-nav-menu"
          id="mobile-navigation-menu"
          aria-label="Mobile navigation"
          aria-hidden={!navigationOpen}
          data-open={navigationOpen}
        >
          {navigationItems.map((item) => (
            <a
              className="mobile-nav-link"
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
              tabIndex={navigationOpen ? 0 : -1}
              key={item.href}
              onClick={() => setOpenMenu(null)}
            >
              {item.current ? (
                <span className="home-icon" aria-hidden="true" />
              ) : (
                <span className="nav-index">{item.index}</span>
              )}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="theme-control">
        <button
          className={`theme-toggle${isSwitching ? ' is-switching' : ''}`}
          type="button"
          onClick={() => toggleMenu('theme')}
          aria-label={`Choose theme. Current theme: ${mode}.`}
          aria-haspopup="menu"
          aria-expanded={themeOpen}
          aria-controls="theme-menu"
        >
          <span className="theme-icon" aria-hidden="true">
            <span className="sun-diagonals" />
            <span className="sun-core" />
          </span>
        </button>

        {/* This menu also stays mounted so closing is as smooth as opening. */}
        <div
          className="theme-menu"
          id="theme-menu"
          role="menu"
          aria-hidden={!themeOpen}
          data-open={themeOpen}
        >
          {themeOptions.map((option) => (
            <button
              className="theme-option"
              type="button"
              role="menuitemradio"
              aria-checked={mode === option.value}
              tabIndex={themeOpen ? 0 : -1}
              key={option.value}
              onClick={() => selectTheme(option.value)}
            >
              <span>{option.label}</span>
              <span className="option-indicator" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
