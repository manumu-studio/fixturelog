// Render tests for the landing page
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Home from './page';

describe('Landing page', () => {
  it('renders the title and tagline', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('FixtureLog');
    expect(html).toContain('Offshore vessel fixture management for shipbrokers.');
  });

  it('renders navigation links to /map and the API routes', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('href="/map"');
    expect(html).toContain('href="/api/health"');
    expect(html).toContain('href="/api/vessels"');
    expect(html).toContain('href="/api/fixtures"');
    expect(html).toContain('href="/api/requirements"');
  });
});
