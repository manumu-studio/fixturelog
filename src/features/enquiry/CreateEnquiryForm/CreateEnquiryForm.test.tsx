// CreateEnquiryForm.test.tsx — proves Fleet Explorer prefill values are reflected
// in the deterministic charterer enquiry form.
import type { ReactNode, AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('@/features/enquiry/useCreateEnquiry', () => {
  function useCreateEnquiry() {
    return {
      submit: vi.fn(),
      errors: {},
      submitting: false,
      formError: null,
    };
  }
  return { useCreateEnquiry };
});

vi.mock('next/link', () => {
  function MockLink({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
    return <a href={href} {...rest}>{children}</a>;
  }
  return { default: MockLink };
});

import { CreateEnquiryForm } from './CreateEnquiryForm';

describe('CreateEnquiryForm', () => {
  it('prefills vessel type and region from the Fleet Explorer deep link', () => {
    const html = renderToStaticMarkup(
      <CreateEnquiryForm prefill={{ vesselType: 'AHTS', regionCode: 'NORTH_SEA' }} />,
    );

    expect(html).toContain('<option value="AHTS" selected="">AHTS — Anchor Handling</option>');
    expect(html).toContain('<option value="NORTH_SEA" selected="">North Sea</option>');
    expect(html).toContain('Create enquiry');
    expect(html).toContain('href="/portal/enquiries"');
  });
});
