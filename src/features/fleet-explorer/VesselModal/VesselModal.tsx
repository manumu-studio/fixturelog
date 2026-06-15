// VesselModal.tsx — adapted from OR_Studio ModalShell: vessel specs, optional Lightbox,
// honesty image credit, and a "Use in enquiry" deep link. Client component.
'use client';

import { Modal } from '@/components/portal/Modal';
import { Lightbox } from '@/components/portal/Lightbox';
import { PortalButton } from '@/components/portal/PortalButton';
import { StatusBadge } from '@/components/portal/StatusBadge';
import { formatMoney } from '@/lib/utils/format';
import type { FleetVessel } from '@/lib/validators/portal.validators';
import type { VesselModalProps } from './VesselModal.types';
import styles from './VesselModal.module.css';

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.spec}>
      <dt className={styles.specLabel}>{label}</dt>
      <dd className={styles.specValue}>{value}</dd>
    </div>
  );
}

function enquiryHref(vessel: FleetVessel): string {
  const region = vessel.regionCode !== null ? `&regionCode=${vessel.regionCode}` : '';
  return `/portal/enquiries/new?vesselType=${vessel.vesselType}${region}`;
}

function VesselModalBody({
  vessel,
  canCreateEnquiry,
}: {
  vessel: FleetVessel;
  canCreateEnquiry: boolean;
}) {
  const images = [...new Set([vessel.imageUrl, ...vessel.images].filter((s): s is string => s !== null))];
  return (
    <div className={styles.shell}>
      {images.length > 0 ? (
        <div className={styles.media}>
          <Lightbox images={images} alt={vessel.name} frameClassName={styles.mediaFrame ?? ''} />
        </div>
      ) : null}
      <div className={styles.content}>
      <div className={styles.head}>
        <h2 id="vessel-modal-title" className={styles.title}>
          {vessel.name}
        </h2>
        <StatusBadge status={vessel.status} />
      </div>
      <p className={styles.sub}>
        {vessel.vesselType} · {vessel.ownerName}
        {vessel.regionName !== null ? ` · ${vessel.regionName}` : ''}
      </p>
      <dl className={styles.specs}>
        <Spec label="DP class" value={vessel.dpClass} />
        <Spec label="Deck area" value={vessel.deckAreaM2 !== null ? `${vessel.deckAreaM2} m²` : '—'} />
        <Spec label="Bollard pull" value={vessel.bollardPullT !== null ? `${vessel.bollardPullT} t` : '—'} />
        <Spec label="Built" value={vessel.builtYear !== null ? String(vessel.builtYear) : '—'} />
        <Spec label="Open port" value={vessel.openPort ?? vessel.portName ?? '—'} />
        <Spec
          label="Rate benchmark"
          value={vessel.rate !== null ? `${formatMoney(vessel.rate.median, 'GBP')}/day median` : '—'}
        />
      </dl>
      {vessel.imageCredit !== null && <p className={styles.credit}>{vessel.imageCredit}</p>}
      {canCreateEnquiry && (
        <div className={styles.actions}>
          <PortalButton href={enquiryHref(vessel)}>Use in enquiry</PortalButton>
        </div>
      )}
      </div>
    </div>
  );
}

export function VesselModal({ vessel, onClose, canCreateEnquiry }: VesselModalProps) {
  return (
    <Modal open={vessel !== null} onClose={onClose} labelledBy="vessel-modal-title">
      {vessel !== null && (
        <VesselModalBody vessel={vessel} canCreateEnquiry={canCreateEnquiry} />
      )}
    </Modal>
  );
}
