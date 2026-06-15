// PortalPageHeader.tsx — eyebrow -> Playfair heading -> subline, matching the landing's
// FeatureShowcase rhythm. Server component. The actions slot holds a CTA on desktop.
import type { PortalPageHeaderProps } from './PortalPageHeader.types';
import styles from './PortalPageHeader.module.css';

export function PortalPageHeader({ eyebrow, title, subline, actions }: PortalPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.text}>
        {eyebrow !== undefined && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subline !== undefined && <p className={styles.subline}>{subline}</p>}
      </div>
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
