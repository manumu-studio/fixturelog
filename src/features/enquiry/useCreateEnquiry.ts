// useCreateEnquiry.ts — client hook: validates with the shared schema, POSTs to
// /api/portal/enquiries (chartererId is never sent — the server sets the owner), and
// routes to the new enquiry detail on success. The response is Zod-parsed at the boundary.
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { PortalEnquiryCreateSchema } from '@/lib/validators/portal.validators';

export type FieldErrors = Record<string, string>;

const CreateResponseSchema = z.object({ data: z.object({ id: z.string() }) });

function collectFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export interface UseCreateEnquiry {
  submit: (raw: Record<string, unknown>) => Promise<void>;
  errors: FieldErrors;
  submitting: boolean;
  formError: string | null;
}

export function useCreateEnquiry(): UseCreateEnquiry {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = useCallback(
    async (raw: Record<string, unknown>) => {
      setFormError(null);
      const parsed = PortalEnquiryCreateSchema.safeParse(raw);
      if (!parsed.success) {
        setErrors(collectFieldErrors(parsed.error));
        return;
      }
      setErrors({});
      setSubmitting(true);
      try {
        const res = await fetch('/api/portal/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(raw),
        });
        if (!res.ok) {
          setFormError('Could not create the enquiry. Please review the fields and try again.');
          return;
        }
        const json: unknown = await res.json();
        const result = CreateResponseSchema.safeParse(json);
        router.push(result.success ? `/portal/enquiries/${result.data.data.id}` : '/portal/enquiries');
      } catch {
        setFormError('Network error — please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [router],
  );

  return { submit, errors, submitting, formError };
}
