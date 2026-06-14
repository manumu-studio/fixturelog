// page.test.tsx — unit tests for the public landing page (PACKET-007 TASK-067).
// Uses renderToStaticMarkup (node env) with mocks for client-only dependencies.

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { ReactNode, HTMLAttributes, AnchorHTMLAttributes } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the component under test
// ---------------------------------------------------------------------------

// next/link renders an <a> in static markup; proxy through so hrefs survive.
vi.mock('next/link', () => {
  function MockLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
    return <a href={href} {...rest}>{children}</a>;
  }
  return { default: MockLink };
});

// motion/react-client — `import * as motion` maps named module exports to motion.*.
// Export every HTML element type used across landing components so motion.* resolves.
vi.mock('motion/react-client', async () => {
  const React = await import('react');

  type MotionProps = HTMLAttributes<HTMLElement> & {
    children?: ReactNode;
    // Strip motion-only props before forwarding to DOM elements
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
    whileInView?: unknown;
    viewport?: unknown;
  };

  // Named functions satisfy react/display-name; omit motion props before DOM forwarding.
  function MotionP({ children, initial, animate, transition, whileInView, viewport, onMouseEnter, onMouseLeave, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('p', { onMouseEnter, onMouseLeave, ...rest }, children);
  }
  function MotionH1({ children, initial, animate, transition, whileInView, viewport, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('h1', rest, children);
  }
  function MotionDiv({ children, initial, animate, transition, whileInView, viewport, onMouseEnter, onMouseLeave, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('div', { onMouseEnter, onMouseLeave, ...rest }, children);
  }
  function MotionUl({ children, initial, animate, transition, whileInView, viewport, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('ul', rest, children);
  }
  function MotionLi({ children, initial, animate, transition, whileInView, viewport, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('li', rest, children);
  }
  function MotionLine({ children, initial, animate, transition, whileInView, viewport, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('line', rest, children);
  }

  // Covers: motion.p, motion.h1, motion.div, motion.ul, motion.li, motion.line
  return { p: MotionP, h1: MotionH1, div: MotionDiv, ul: MotionUl, li: MotionLi, line: MotionLine };
});

// MarineTrafficCanvas — canvas is not renderable server-side; stub as a recognisable element.
vi.mock('@/components/landing/MarineTrafficCanvas', () => {
  function MarineTrafficCanvas() { return <canvas data-testid="marine-canvas" aria-hidden="true" />; }
  return { MarineTrafficCanvas };
});

// Suppress browser-API side effects that run in useEffect (window.matchMedia, rAF, scrollY).
vi.mock('react', async () => {
  const actual = await import('react');
  return {
    ...actual,
    useEffect: vi.fn(),
    useState: (init: unknown) => [init, vi.fn()],
  };
});

import Home from './page';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renders the public product story', () => {
  it('contains the FixtureLog brand name', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('FixtureLog');
  });

  it('contains offshore / North Sea domain language', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html.toLowerCase()).toContain('offshore');
  });

  it('contains the primary CTA label "Explore Requirements"', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('Explore Requirements');
  });

  it('contains the secondary CTA label "View Regional Map"', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('View Regional Map');
  });
});

describe('links only to public demo routes and planned disabled auth UI', () => {
  let html: string;

  beforeAll(() => {
    html = renderToStaticMarkup(<Home />);
  });

  it('primary CTA links to /requirements', () => {
    expect(html).toContain('href="/requirements"');
  });

  it('secondary CTA links to /map', () => {
    expect(html).toContain('href="/map"');
  });

  it('utility link to /charterers is present', () => {
    expect(html).toContain('href="/charterers"');
  });

  it('utility link to /charterers/new with label "Add Charterer" is present', () => {
    expect(html).toContain('href="/charterers/new"');
    expect(html).toContain('Add Charterer');
  });

  it('utility link to /api/health is present', () => {
    expect(html).toContain('href="/api/health"');
  });

  it('"Sign in coming next" teaser text is present', () => {
    expect(html).toContain('Sign in coming next');
  });

  it('"Sign in coming next" teaser is NOT an anchor/link — triggers no auth', () => {
    // Extract all <a> tags and confirm none contain the auth teaser text.
    const anchorMatches = html.match(/<a [^>]*>[\s\S]*?<\/a>/g) ?? [];
    const authAnchor = anchorMatches.find((tag) => tag.includes('Sign in coming next'));
    expect(authAnchor).toBeUndefined();
  });

  it('no element links to /api/auth or any auth route', () => {
    expect(html).not.toContain('/api/auth');
    expect(html).not.toContain('href="/auth');
    expect(html).not.toContain('href="/login');
    expect(html).not.toContain('href="/signin');
  });
});

describe('describes seeded and deterministic demo boundaries', () => {
  let html: string;

  beforeAll(() => {
    html = renderToStaticMarkup(<Home />);
  });

  it('mentions "seeded" to signal synthetic data boundaries', () => {
    expect(html.toLowerCase()).toContain('seeded');
  });

  it('mentions "deterministic" to signal no live AI generation', () => {
    expect(html.toLowerCase()).toContain('deterministic');
  });

  it('does NOT claim "live AIS" data', () => {
    expect(html.toLowerCase()).not.toContain('live ais');
  });
});
