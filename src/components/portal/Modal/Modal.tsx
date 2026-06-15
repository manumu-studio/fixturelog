// Modal.tsx — shared headless modal (adapted from OR_Studio ModalShell), token-only.
// Motion fade/scale, backdrop + ESC close, focus trap, body-scroll lock. Portaled to body.
'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ModalProps } from './Modal.types';
import { useModalA11y } from './useModalA11y';
import styles from './Modal.module.css';

export function Modal({ open, onClose, children, labelledBy, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion() ?? false;
  useModalA11y(open, onClose, panelRef);

  if (typeof document === 'undefined') return null;

  const panelClass = `${styles.panel}${className !== undefined ? ` ${className}` : ''}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          data-surface="navy"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <motion.div
            ref={panelRef}
            className={panelClass}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            {...(labelledBy !== undefined ? { 'aria-labelledby': labelledBy } : {})}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.19, 1, 0.22, 1] }}
          >
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              ×
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
