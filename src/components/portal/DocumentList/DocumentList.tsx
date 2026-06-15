// DocumentList.tsx — the charterer's recap documents with copy + download actions. Client
// component (clipboard + blob download). Distinguishes final vs draft recaps.
'use client';

import { useState } from 'react';
import { PortalCard } from '@/components/portal/PortalCard';
import { EmptyState } from '@/components/portal/EmptyState';
import { PortalButton } from '@/components/portal/PortalButton';
import { formatDate } from '@/lib/utils/format';
import type { PortalDocument } from '@/lib/validators/portal.validators';
import type { DocumentListProps } from './DocumentList.types';
import styles from './DocumentList.module.css';

function downloadMarkdown(doc: PortalDocument): void {
  const blob = new Blob([doc.generatedMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `recap-${doc.vesselName.replace(/\s+/g, '-').toLowerCase()}-v${doc.version}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DocumentItem({ doc }: { doc: PortalDocument }) {
  const [copied, setCopied] = useState(false);
  const onCopy = (): void => {
    void navigator.clipboard.writeText(doc.generatedText).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  };

  return (
    <li className={styles.item}>
      <div className={styles.meta}>
        <span className={styles.vessel}>{doc.vesselName}</span>
        <span className={doc.isFinal ? `${styles.tag} ${styles.final}` : `${styles.tag} ${styles.draft}`}>
          {doc.isFinal ? 'Final' : 'Draft'}
        </span>
        <span className={styles.version}>v{doc.version}</span>
        <span className={styles.date}>{formatDate(doc.createdAt)}</span>
      </div>
      <div className={styles.actions}>
        <PortalButton variant="secondary" size="sm" onClick={onCopy}>
          {copied ? 'Copied' : 'Copy text'}
        </PortalButton>
        <PortalButton size="sm" onClick={() => downloadMarkdown(doc)}>
          Download .md
        </PortalButton>
      </div>
    </li>
  );
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <PortalCard>
        <EmptyState
          title="No documents yet"
          message="Recap drafts and final recaps for your fixtures will appear here."
        />
      </PortalCard>
    );
  }

  return (
    <PortalCard padded={false}>
      <ul className={styles.list}>
        {documents.map((doc) => (
          <DocumentItem key={doc.id} doc={doc} />
        ))}
      </ul>
    </PortalCard>
  );
}
