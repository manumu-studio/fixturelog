// AuthCta.types.ts — props for the auth-aware landing CTA.

export interface AuthCtaProps {
  // 'nav' renders compact CTAs for the navbar; 'hero' renders prominent buttons.
  readonly variant: 'nav' | 'hero';
}
