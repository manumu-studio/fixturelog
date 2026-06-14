// LandingNav.tsx — scroll-aware fixed nav: transparent on load, blurred on scroll.
// Includes a mobile hamburger toggle so nav links are accessible at all widths.
// No auth functions called.

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LANDING_NAV_AUTH_TEASER,
  LANDING_NAV_LINKS,
} from '@/lib/constants/landing-copy';
import type { LandingNavProps } from './LandingNav.types';
import styles from './LandingNav.module.css';

export function LandingNav({ className }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const threshold = 50;

    function handleScroll() {
      setScrolled(window.scrollY > threshold);
    }

    // Set initial state in case the page loads already scrolled.
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop width.
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 640) setMenuOpen(false);
    }
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navClass = [
    styles.nav,
    scrolled || menuOpen ? styles.navScrolled : styles.navTransparent,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={navClass} aria-label="Main navigation">
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="FixtureLog home">
          FixtureLog
        </Link>

        {/* Mobile hamburger toggle — only visible at <640px */}
        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls="nav-links"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => { setMenuOpen((prev) => !prev); }}
        >
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
        </button>

        <ul
          id="nav-links"
          className={[styles.links, menuOpen ? styles.linksOpen : ''].filter(Boolean).join(' ')}
          role="list"
        >
          {LANDING_NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={styles.link}
                onClick={() => { setMenuOpen(false); }}
              >
                {link.label}
              </Link>
            </li>
          ))}

          {/* Disabled auth teaser — no auth function called */}
          <li>
            <span
              className={styles.authTeaser}
              aria-disabled="true"
              title={LANDING_NAV_AUTH_TEASER.label}
            >
              {LANDING_NAV_AUTH_TEASER.label}
            </span>
          </li>
        </ul>
      </div>
    </nav>
  );
}
