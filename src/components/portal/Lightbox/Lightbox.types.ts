// Props for the shared inline image gallery (adapted from OR_Studio LightboxGallery).
export interface LightboxProps {
  images: string[];
  /** Accessible base label (e.g. the vessel name). */
  alt: string;
  startIndex?: number;
  /** Optional class for the main image frame (e.g. flush modal edges). */
  frameClassName?: string | undefined;
}
