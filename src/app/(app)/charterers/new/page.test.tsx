// Render tests for the new-charterer page.

import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NewChartererPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('NewChartererPage', () => {
  it('renders the charterer registration form', () => {
    const html = renderToStaticMarkup(<NewChartererPage />);

    expect(html).toContain('Register Charterer');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="contactEmail"');
    expect(html).toContain('Register charterer');
    expect(html).toContain('href="/charterers"');
  });
});
