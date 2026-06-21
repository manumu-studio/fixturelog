// page.test.tsx - unit tests for the locked public build landing page.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Home from './page';

describe('locked public build landing', () => {
  const html = renderToStaticMarkup(<Home />);
  const lowerHtml = html.toLowerCase();

  it('announces that the junior assistant is being built', () => {
    expect(html).toContain('Private build in progress');
    expect(lowerHtml).toContain('two junior assistants');
    expect(lowerHtml).toContain('matching');
    expect(lowerHtml).toContain('supervised');
  });

  it('keeps the message specific to offshore chartering needs', () => {
    expect(lowerHtml).toContain('offshore');
    expect(lowerHtml).toContain('broker and charterer');
    expect(html).toContain('The desk stays private while the service takes shape.');
  });

  it('renders a junior assistant preview without wiring live voice controls', () => {
    expect(html).toContain('Build status');
    expect(html).toContain('Assistant previews');
    expect(html).toContain('Activated');
    expect(html).toContain('Assistant preview card');
    expect(html).toContain('Voice identity being shaped.');
    expect(html).toContain('vessel matching');
    expect(html).toContain('Activate assistant preview');
    expect(html).not.toContain('Assistant preview</span>');
    expect(html).not.toContain('Voice briefing');
    expect(html).not.toContain('Play briefing');
    expect(html).not.toContain('speechSynthesis');
    expect(html).not.toContain('/api/broker/voice/token');
  });

  it('does not expose unfinished product routes or sign-in CTAs publicly', () => {
    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain('href="/portal"');
    expect(html).not.toContain('href="/requirements"');
    expect(html).not.toContain('href="/charterers"');
    expect(html).not.toContain('href="/map"');
    expect(html).not.toContain('Go to Workspace');
    expect(html).not.toContain('Sign in');
  });

  it('renders interactive build-signal controls', () => {
    expect(html).toContain('aria-label="Build status signals"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('Chartering assistant');
    expect(html).toContain('Matching assistant');
  });

  it('keeps the assistant visual and disclosure inside one preview card', () => {
    expect(html).toContain('card-overlay');
    expect(html).not.toContain('More info');
    expect(html).not.toContain('M5 7.5 10 12.5 15 7.5');
    expect(html).toMatch(/Assistant preview card[\s\S]+Build status/);
  });

  it('renders the limited public assistant preview with curated prompts only', () => {
    expect(html).toContain('Limited assistant preview');
    expect(html).toContain('What is being built?');
    expect(html).toContain('Broker help');
    expect(html).toContain('Why private?');
    expect(html).not.toContain('/api/broker/copilot');
    expect(html).not.toContain('/api/broker/voice/token');
  });
});
