// PortalNav.tsx — navy operational navbar for authenticated portal and broker routes.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND_NAME } from '@/lib/constants/brand';
import {
  PORTAL_NAV_ITEMS,
  type PortalNavItem,
  type PortalNavProps,
} from './PortalNav.types';
import styles from './PortalNav.module.css';

function activeHref(pathname: string, items: PortalNavItem[]): string {
  let best = '';
  for (const item of items) {
    const matches = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && item.href.length > best.length) best = item.href;
  }
  return best;
}

function NavItemLink({
  item,
  active,
  onNavigate,
}: {
  item: PortalNavItem;
  active: string;
  onNavigate: () => void;
}) {
  const isActive = item.href === active;

  if (item.emphasis === 'cta') {
    return (
      <Link
        href={item.href}
        className={isActive ? `${styles.linkCta} ${styles.linkCtaActive}` : styles.linkCta}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={isActive ? `${styles.link} ${styles.linkActive}` : styles.link}
      aria-current={isActive ? 'page' : undefined}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  );
}

export function PortalNav({
  user,
  items = PORTAL_NAV_ITEMS,
  homeHref = '/portal',
  brandSub = 'Client Portal',
}: PortalNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = activeHref(pathname, items);
  const close = (): void => { setMenuOpen(false); };

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 960) setMenuOpen(false);
    }
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className={styles.nav} aria-label={`${brandSub} navigation`}>
      <div className={styles.inner}>
        <Link href={homeHref} className={styles.brand} onClick={close}>
          {BRAND_NAME} <span className={styles.brandSub}>{brandSub}</span>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={menuOpen}
          aria-controls="portal-nav-links"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => { setMenuOpen((value) => !value); }}
        >
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
        </button>

        <div
          id="portal-nav-links"
          className={[styles.toolbar, menuOpen ? styles.toolbarOpen : ''].filter(Boolean).join(' ')}
        >
          <ul className={styles.links} role="list">
            {items.map((item) => (
              <li key={item.href}>
                <NavItemLink item={item} active={active} onNavigate={close} />
              </li>
            ))}
          </ul>

          <div className={styles.user}>
            {user.name !== null && user.name.trim().length > 0 ? (
              <span className={styles.userName}>{user.name}</span>
            ) : null}
            {user.email !== null ? (
              <span className={styles.userEmail}>{user.email}</span>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
