'use client';

import { useRef } from 'react';

const REQUIRED_CLICKS = 3;
const CLICK_WINDOW_MS = 2000;

export default function SecretBrand({ label }: { label: string }) {
  const recentClicks = useRef<number[]>([]);

  const handleBrandClick = () => {
    const now = performance.now();

    // Keep a rolling two-second window so slow or accidental clicks reset naturally.
    recentClicks.current = recentClicks.current
      .filter((clickTime) => now - clickTime <= CLICK_WINDOW_MS)
      .concat(now);

    if (recentClicks.current.length >= REQUIRED_CLICKS) {
      recentClicks.current = [];
      window.location.assign('https://admin.fadialhazim.com');
    }
  };

  return (
    <button
      className="header-brand"
      type="button"
      aria-label="Fadi Al Hazim"
      onClick={handleBrandClick}
    >
      <span className="brand-mark" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
