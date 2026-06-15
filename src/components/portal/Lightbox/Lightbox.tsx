// Lightbox.tsx — inline image gallery (adapted from OR_Studio LightboxGallery): main
// image with arrow/keyboard/dot navigation and a Motion cross-fade. Token-only styles.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { LightboxProps } from './Lightbox.types';
import styles from './Lightbox.module.css';

export function Lightbox({ images, alt, startIndex = 0, frameClassName }: LightboxProps) {
  const count = images.length;
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(count - 1, 0)));
  const reduce = useReducedMotion() ?? false;

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, count]);

  const current = images[index];
  if (current === undefined) return null;

  return (
    <div className={styles.lightbox}>
      <div className={[styles.frame, frameClassName].filter(Boolean).join(' ')}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className={styles.imageWrap}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -16 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.19, 1, 0.22, 1] }}
          >
            <Image
              src={current}
              alt={`${alt} — image ${index + 1} of ${count}`}
              fill
              sizes="(max-width: 760px) 100vw, 720px"
              className={styles.image}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className={styles.dots}>
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              className={i === index ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              onClick={() => setIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
