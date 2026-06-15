// CreateEnquiryForm.tsx — deterministic enquiry form (no AI). Holds string field state,
// builds the typed payload, and delegates validation + submit to useCreateEnquiry.
'use client';

import { useState } from 'react';
import { PortalButton } from '@/components/portal/PortalButton';
import { useCreateEnquiry } from '@/features/enquiry/useCreateEnquiry';
import type { CreateEnquiryFormProps } from './CreateEnquiryForm.types';
import { EnquiryFields } from './CreateEnquiryForm.fields';
import styles from './CreateEnquiryForm.module.css';

function buildPayload(values: Record<string, string>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    vesselTypeNeeded: values.vesselTypeNeeded,
    regionCode: values.regionCode,
    workscopeCode: values.workscopeCode,
    charterType: values.charterType,
    startDate: values.startDate,
  };
  if (values.endDate) payload.endDate = values.endDate;
  if (values.durationDays) payload.durationDays = Number(values.durationDays);
  if (values.dayRateBudget) payload.dayRateBudget = Number(values.dayRateBudget);
  if (values.notes) payload.notes = values.notes;
  return payload;
}

export function CreateEnquiryForm({ prefill }: CreateEnquiryFormProps) {
  const { submit, errors, submitting, formError } = useCreateEnquiry();
  const [values, setValues] = useState<Record<string, string>>({
    vesselTypeNeeded: prefill?.vesselType ?? '',
    regionCode: prefill?.regionCode ?? '',
    workscopeCode: '',
    charterType: 'SPOT',
    startDate: '',
    endDate: '',
    durationDays: '',
    dayRateBudget: '',
    notes: '',
  });

  const update = (name: string, value: string): void =>
    setValues((v) => ({ ...v, [name]: value }));

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        void submit(buildPayload(values));
      }}
      noValidate
    >
      <EnquiryFields values={values} errors={errors} update={update} />
      {formError !== null && <p className={styles.formError}>{formError}</p>}
      <div className={styles.actions}>
        <PortalButton href="/portal/enquiries" variant="secondary" size="sm">
          Cancel
        </PortalButton>
        <PortalButton type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create enquiry'}
        </PortalButton>
      </div>
    </form>
  );
}
