// PortalShell.tsx — portal layout chrome: sticky nav + centered main content. Server
// component; the nav is the only client island.
import { PortalNav } from '@/components/portal/PortalNav';
import type { PortalShellProps } from './PortalShell.types';
import styles from './PortalShell.module.css';

export function PortalShell({ user, children, navItems, homeHref, brandSub }: PortalShellProps) {
  return (
    <div className={styles.shell}>
      <PortalNav user={user} items={navItems} homeHref={homeHref} brandSub={brandSub} />
      <main className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
    </div>
  );
}
