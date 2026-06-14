// /charterers/new — client-side form for registering a charterer.

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const CreateChartererResponseSchema = z.object({
  data: z.object({
    id: z.string().cuid(),
  }),
});

function optionalField(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildPayload(formData: FormData) {
  return {
    name: optionalField(formData, 'name') ?? '',
    sector: optionalField(formData, 'sector'),
    contactName: optionalField(formData, 'contactName'),
    contactEmail: optionalField(formData, 'contactEmail'),
    contactPhone: optionalField(formData, 'contactPhone'),
    notes: optionalField(formData, 'notes'),
  };
}

export default function NewChartererPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch('/api/charterers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(new FormData(event.currentTarget))),
    });

    const body: unknown = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setError(response.status === 409
        ? 'A charterer with this name already exists.'
        : 'Could not register charterer. Check the required fields and try again.');
      return;
    }

    const parsed = CreateChartererResponseSchema.safeParse(body);
    if (!parsed.success) {
      setIsSubmitting(false);
      setError('The server returned an unexpected response.');
      return;
    }

    router.push(`/charterers/${parsed.data.data.id}`);
    router.refresh();
  }

  return (
    <main>
      <Link href="/charterers">← Charterers</Link>

      <section>
        <h1>Register Charterer</h1>
        <p>Create a charterer record before adding enquiries or fixtures.</p>
      </section>

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" required maxLength={200} />
        </label>

        <label>
          Sector
          <input name="sector" maxLength={100} />
        </label>

        <label>
          Contact name
          <input name="contactName" maxLength={200} />
        </label>

        <label>
          Contact email
          <input name="contactEmail" type="email" />
        </label>

        <label>
          Contact phone
          <input name="contactPhone" maxLength={50} />
        </label>

        <label>
          Notes
          <textarea name="notes" maxLength={1000} />
        </label>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register charterer'}
        </button>
      </form>
    </main>
  );
}
