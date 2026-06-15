// CreateEnquiryForm.fields.tsx — small field primitives + the full field set for the
// enquiry form, kept separate so the form component stays within the function-length budget.
'use client';

import {
  CHARTER_TYPE_OPTIONS, REGION_OPTIONS, VESSEL_TYPE_OPTIONS, WORKSCOPE_OPTIONS,
  type EnquiryOption,
} from '@/features/enquiry/enquiry-options';
import type { FieldErrors } from '@/features/enquiry/useCreateEnquiry';
import styles from './CreateEnquiryForm.module.css';

type Update = (name: string, value: string) => void;

interface SelectProps {
  label: string;
  name: string;
  value: string;
  options: EnquiryOption[];
  error?: string | undefined;
  update: Update;
  placeholder?: string;
}

function SelectField({ label, name, value, options, error, update, placeholder }: SelectProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select className={styles.input} value={value} onChange={(e) => update(name, e.target.value)}>
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error !== undefined && <span className={styles.error}>{error}</span>}
    </label>
  );
}

interface InputProps {
  label: string;
  name: string;
  value: string;
  type: 'date' | 'number' | 'text';
  error?: string | undefined;
  update: Update;
}

function InputField({ label, name, value, type, error, update }: InputProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        min={type === 'number' ? 0 : undefined}
        onChange={(e) => update(name, e.target.value)}
      />
      {error !== undefined && <span className={styles.error}>{error}</span>}
    </label>
  );
}

export interface FieldSetProps {
  values: Record<string, string>;
  errors: FieldErrors;
  update: Update;
}

export function EnquiryFields({ values, errors, update }: FieldSetProps) {
  return (
    <div className={styles.grid}>
      <SelectField label="Vessel type" name="vesselTypeNeeded" value={values.vesselTypeNeeded ?? ''} options={VESSEL_TYPE_OPTIONS} error={errors.vesselTypeNeeded} update={update} />
      <SelectField label="Region" name="regionCode" value={values.regionCode ?? ''} options={REGION_OPTIONS} error={errors.regionCode} update={update} />
      <SelectField label="Workscope" name="workscopeCode" value={values.workscopeCode ?? ''} options={WORKSCOPE_OPTIONS} error={errors.workscopeCode} update={update} />
      <SelectField label="Charter type" name="charterType" value={values.charterType ?? ''} options={CHARTER_TYPE_OPTIONS} error={errors.charterType} update={update} placeholder="Select…" />
      <InputField label="Start date" name="startDate" value={values.startDate ?? ''} type="date" error={errors.startDate} update={update} />
      <InputField label="End date (optional)" name="endDate" value={values.endDate ?? ''} type="date" error={errors.endDate} update={update} />
      <InputField label="Duration (days, optional)" name="durationDays" value={values.durationDays ?? ''} type="number" error={errors.durationDays} update={update} />
      <InputField label="Day-rate budget (optional)" name="dayRateBudget" value={values.dayRateBudget ?? ''} type="number" error={errors.dayRateBudget} update={update} />
      <label className={`${styles.field} ${styles.fieldWide}`}>
        <span className={styles.label}>Notes (optional)</span>
        <textarea
          className={styles.textarea}
          value={values.notes ?? ''}
          rows={3}
          onChange={(e) => update('notes', e.target.value)}
        />
        {errors.notes !== undefined && <span className={styles.error}>{errors.notes}</span>}
      </label>
    </div>
  );
}
