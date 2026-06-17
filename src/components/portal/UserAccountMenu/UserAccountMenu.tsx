// UserAccountMenu.tsx — initials avatar that opens a sign-out modal in portal chrome.

'use client';

import { useId, useState } from 'react';
import { Modal } from '@/components/portal/Modal';
import { PortalButton } from '@/components/portal/PortalButton';
import type { PortalNavUser } from '@/components/portal/PortalNav/PortalNav.types';
import { getUserInitials } from './getUserInitials';
import styles from './UserAccountMenu.module.css';

interface UserAccountMenuProps {
  readonly user: PortalNavUser;
  /** `nav` — light avatar ring on the navy portal navbar. */
  readonly tone?: 'default' | 'nav' | undefined;
}

export function UserAccountMenu({ user, tone = 'default' }: UserAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const initials = getUserInitials(user.name, user.email);
  const displayName = user.name ?? 'Account';

  return (
    <>
      <button
        type="button"
        className={[styles.avatar, tone === 'nav' ? styles.avatarNav : ''].filter(Boolean).join(' ')}
        aria-label={`Open account menu for ${displayName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setOpen(true); }}
      >
        {initials}
      </button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); }}
        labelledBy={titleId}
        className={styles.panel}
      >
        <div className={styles.menu}>
          <span className={styles.avatarLarge} aria-hidden="true">{initials}</span>
          <h2 id={titleId} className={styles.title}>{displayName}</h2>
          {user.email !== null ? <p className={styles.email}>{user.email}</p> : null}
          <div className={styles.actions}>
            <PortalButton
              href="/api/auth/federated-signout"
              external
              variant="secondary"
              fullWidth
            >
              Sign out
            </PortalButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
