// VesselCard.tsx — adapted from OR_Studio GridCard: image + bottom label (name + type).
// Clicking opens the shared VesselModal. Client component (onSelect handler).
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { VesselCardImageLoader } from './VesselCardImageLoader';
import type { VesselCardProps } from './VesselCard.types';
import styles from './VesselCard.module.css';

const FALLBACK_IMAGE = '/assets/vessels/generic.svg';

export function VesselCard({ vessel, onSelect }: VesselCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect(vessel.id)}
      aria-label={`View ${vessel.name} (${vessel.vesselType})`}
    >
      <span className={styles.imageWrap}>
        <VesselCardImageLoader hidden={loaded} />
        <Image
          src={vessel.imageUrl ?? FALLBACK_IMAGE}
          alt={vessel.name}
          fill
          sizes="(max-width: 720px) 50vw, 280px"
          className={[styles.image, loaded ? styles.imageVisible : ''].filter(Boolean).join(' ')}
          onLoad={() => { setLoaded(true); }}
          onError={() => { setLoaded(true); }}
        />
      </span>
      <span className={styles.label}>
        <span className={styles.name}>{vessel.name}</span>
        <span className={styles.type}>{vessel.vesselType}</span>
      </span>
    </button>
  );
}
