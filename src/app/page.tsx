// page.tsx - locked public build page while FixtureLog is refined privately.
import { LandingNav } from '@/components/landing/LandingNav';
import { BuildPageHero } from './BuildPageHero';
import styles from './page.module.css';

const BUILD_SUMMARY =
  'FixtureLog is building two junior assistants: one for broker-charterer handoffs and one for vessel matching. The public demo stays closed while the service and guided previews are prepared.';

const BUILD_PANEL_ITEMS = [
  {
    label: 'Chartering assistant',
    value: 'Preview',
    detail: 'The first assistant is being shaped for broker-charterer intake, follow-ups, and fixture handoffs.',
  },
  {
    label: 'Matching assistant',
    value: 'Preview',
    detail: 'The second assistant will explain shortlist rationale, score evidence, and vessel fit without exposing live tools.',
  },
  {
    label: 'Public access',
    value: 'Locked',
    detail: 'The public page stays closed while the broker service, charterer service, and assistant previews are prepared.',
  },
] as const;

const PUBLIC_ASSISTANT_PROMPTS = [
  { id: 'what-building', label: 'What is being built?' },
  { id: 'broker-help', label: 'Broker help' },
  { id: 'matching-help', label: 'Matching' },
  { id: 'why-private', label: 'Why private?' },
] as const;

export default function Home() {
  return (
    <>
      <LandingNav hideNavigation />

      <main id="main-content" className={styles.page}>
        <BuildPageHero
          panelTitle="Assistant previews"
          panelSummary={BUILD_SUMMARY}
          panelItems={BUILD_PANEL_ITEMS}
          assistantPrompts={PUBLIC_ASSISTANT_PROMPTS}
        />
      </main>
    </>
  );
}
