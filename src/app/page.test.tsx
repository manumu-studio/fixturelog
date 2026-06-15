// page.test.tsx — unit tests for the public landing page.
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

// next/image (FleetTeaser) — render a plain <img>, dropping next-only layout props.
vi.mock('next/image', () => {
  function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element -- test stub, not production markup
    return <img src={src} alt={alt} />;
  }
  return { default: MockImage };
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
  function MotionSvg({ children, initial, animate, transition, whileInView, viewport, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('svg', rest, children);
  }
  function MotionPath({ children, initial, animate, transition, whileInView, viewport, ...rest }: MotionProps) {
    void initial; void animate; void transition; void whileInView; void viewport;
    return React.createElement('path', rest, children);
  }

  // Covers: motion.p, motion.h1, motion.div, motion.ul, motion.li, motion.line,
  // motion.svg, and motion.path.
  return {
    p: MotionP,
    h1: MotionH1,
    div: MotionDiv,
    ul: MotionUl,
    li: MotionLi,
    line: MotionLine,
    svg: MotionSvg,
    path: MotionPath,
  };
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

// AuthCta is an async server component (calls auth()); stub it so the sync static render works.
vi.mock('@/components/landing/AuthCta', () => {
  function AuthCta({ variant }: { variant: string }) {
    return <div data-testid={`auth-cta-${variant}`}>auth-cta</div>;
  }
  return { AuthCta };
});

import Home from './page';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renders the public product story', () => {
  it('contains the product brand name', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('ManuMu Offshore Partners');
  });

  it('contains offshore / North Sea domain language', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html.toLowerCase()).toContain('offshore');
  });

  it('renders the auth CTA in both the nav and the hero', () => {
    const html = renderToStaticMarkup(<Home />);
    expect(html).toContain('data-testid="auth-cta-nav"');
    expect(html).toContain('data-testid="auth-cta-hero"');
  });
});

describe('links to workflow routes and renders real auth CTAs', () => {
  let html: string;

  beforeAll(() => {
    html = renderToStaticMarkup(<Home />);
  });

  it('nav links to /requirements', () => {
    expect(html).toContain('href="/requirements"');
  });

  it('nav links to /map', () => {
    expect(html).toContain('href="/map"');
  });

  it('does not expose the broker-only charterer list publicly', () => {
    expect(html).not.toContain('href="/charterers"');
  });

  it('utility link to /charterers/new with label "Add Charterer" is present', () => {
    expect(html).toContain('href="/charterers/new"');
    expect(html).toContain('Add Charterer');
  });

  it('utility link to /api/health is present', () => {
    expect(html).toContain('href="/api/health"');
  });

  it('no longer renders the old disabled "coming next" auth teaser', () => {
    expect(html).not.toContain('coming next');
  });

  it('page markup itself links to no bespoke /api/auth or login route', () => {
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
