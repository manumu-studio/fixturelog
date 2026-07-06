// page.test.tsx — unit tests for the public landing page.
// Uses static rendering with mocks for client-only and auth-aware dependencies.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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

vi.mock('next/image', () => {
  function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element -- test stub, not production markup.
    return <img src={src} alt={alt} />;
  }
  return { default: MockImage };
});

vi.mock('motion/react-client', async () => {
  const React = await import('react');

  type MotionProps = HTMLAttributes<HTMLElement> & {
    children?: ReactNode;
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
    whileInView?: unknown;
    viewport?: unknown;
    style?: unknown;
  };

  function stripMotionProps({
    initial,
    animate,
    transition,
    whileInView,
    viewport,
    ...rest
  }: MotionProps) {
    void initial;
    void animate;
    void transition;
    void whileInView;
    void viewport;
    return rest;
  }

  function MotionElement(tag: string, props: MotionProps) {
    return React.createElement(tag, stripMotionProps(props), props.children);
  }

  return {
    p: (props: MotionProps) => MotionElement('p', props),
    h1: (props: MotionProps) => MotionElement('h1', props),
    div: (props: MotionProps) => MotionElement('div', props),
    ul: (props: MotionProps) => MotionElement('ul', props),
    li: (props: MotionProps) => MotionElement('li', props),
    line: (props: MotionProps) => MotionElement('line', props),
    svg: (props: MotionProps) => MotionElement('svg', props),
    path: (props: MotionProps) => MotionElement('path', props),
  };
});

vi.mock('motion/react', async () => {
  const clientMotion = await import('motion/react-client');
  return {
    motion: clientMotion,
    useReducedMotion: () => true,
    useScroll: () => ({ scrollYProgress: 0 }),
    useTransform: () => 1,
  };
});

vi.mock('@/components/landing/MarineTrafficCanvas', () => {
  function MarineTrafficCanvas() {
    return <canvas data-testid="marine-canvas" aria-hidden="true" />;
  }
  return { MarineTrafficCanvas };
});

vi.mock('react', async () => {
  const actual = await import('react');
  return {
    ...actual,
    useEffect: vi.fn(),
    useState: (init: unknown) => [init, vi.fn()],
    useRef: () => ({ current: null }),
  };
});

vi.mock('@/components/landing/AuthCta', () => {
  function AuthCta({ variant }: { variant: string }) {
    return <div data-testid={`auth-cta-${variant}`}>auth-cta</div>;
  }
  return { AuthCta };
});

import Home from './page';

describe('public product landing', () => {
  let html: string;
  let lowerHtml: string;

  beforeAll(() => {
    html = renderToStaticMarkup(<Home />);
    lowerHtml = html.toLowerCase();
  });

  it('restores the offshore workflow story as the first public surface', () => {
    expect(html).toContain('ManuMu Offshore');
    expect(lowerHtml).toContain('from enquiry to recap');
    expect(lowerHtml).toContain('broker');
    expect(lowerHtml).toContain('north sea');
  });

  it('renders auth-aware calls to action in the nav and hero', () => {
    expect(html).toContain('data-testid="auth-cta-nav"');
    expect(html).toContain('data-testid="auth-cta-hero"');
  });

  it('links to the interview demo workspace surfaces', () => {
    expect(html).toContain('href="/requirements"');
    expect(html).toContain('href="/map"');
    expect(html).toContain('href="/charterers/new"');
    expect(html).toContain('href="/api/health"');
  });

  it('keeps the demo boundaries explicit', () => {
    expect(lowerHtml).toContain('seeded');
    expect(lowerHtml).toContain('deterministic');
    expect(lowerHtml).not.toContain('live ais');
  });

  it('does not render the superseded locked assistant page', () => {
    expect(html).not.toContain('Private build in progress');
    expect(html).not.toContain('Assistant previews');
    expect(html).not.toContain('Limited assistant preview');
  });

  it('does not expose broker copilot or live voice endpoints publicly', () => {
    expect(html).not.toContain('/api/broker/copilot');
    expect(html).not.toContain('/api/broker/voice/token');
    expect(html).not.toContain('speechSynthesis');
  });
});
