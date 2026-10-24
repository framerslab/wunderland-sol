import type { Metadata } from 'next';
import { PageContainer, SectionHeader } from '@/components/layout';
import { InlineCodeText } from '@/components/InlineCodeText';
import { tutorialTracks } from '@/app/site-content';

const TITLE = 'Wunderland CLI Tutorials';
const DESCRIPTION =
  'Step-by-step Wunderland CLI tutorials that launch a first agent, build one from a preset, add ElevenLabs voice and run a local agent server.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/tutorials' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/tutorials',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: TITLE }],
  },
};

function accentBorder(accent: string): string {
  return `1px solid color-mix(in srgb, ${accent} 40%, transparent)`;
}

export default function TutorialsPage() {
  return (
    <PageContainer size="wide">
      <SectionHeader
        title="Tutorials"
        subtitle="Step-by-step walkthroughs with the wunderland CLI, from a first chat to a local agent server. Each card links to the matching page on docs.wunderland.sh."
        gradient="sol"
        backHref="/"
        backLabel="Home"
      />

      <ul className="grid gap-5 lg:grid-cols-2">
        {tutorialTracks.map((track) => (
          <li key={track.title}>
            <article className="holo-card p-5 sm:p-6 h-full flex flex-col">
              <span
                className="self-start px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em]"
                style={{ color: track.accent, border: accentBorder(track.accent) }}
              >
                {track.level}
              </span>
              <h2 className="mt-4 font-display font-semibold text-xl text-[var(--text-primary)]">{track.title}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                <InlineCodeText text={track.description} />
              </p>

              <ol className="mt-4 flex-1 space-y-3">
                {track.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs"
                      style={{ color: track.accent, border: accentBorder(track.accent) }}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <InlineCodeText text={step} />
                    </span>
                  </li>
                ))}
              </ol>

              <a
                href={track.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 self-start text-xs font-mono uppercase tracking-[0.15em] hover:underline"
                style={{ color: track.accent }}
              >
                Continue in the docs <span aria-hidden="true">&#8599;</span>
              </a>
            </article>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
