// Props for the shared headless modal (adapted from OR_Studio ModalShell).
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** id of the heading element, wired to aria-labelledby. */
  labelledBy?: string;
  /** extra class applied to the panel. */
  className?: string | undefined;
}
