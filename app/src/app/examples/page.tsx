import type { Metadata } from 'next';
import { PageContainer, SectionHeader } from '@/components/layout';
import { InlineCodeText } from '@/components/InlineCodeText';
import { exampleShowcases } from '@/app/site-content';

const TITLE = 'Wunderland CLI Examples';
const DESCRIPTION =
  'Wunderland CLI examples you can copy and run: a research copilot and an ops assistant built from agent presets, and a voice concierge with ElevenLabs text-to-speech.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/examples' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/examples',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: TITLE }],
  },
};

export default function ExamplesPage() {
  return (
    <PageContainer size="wide">
      <SectionHeader
        title="Examples"
        subtitle="Starting points built from the CLI's agent presets and setup wizard. Each card links to the matching page on docs.wunderland.sh."
        gradient="green"
        backHref="/"
        backLabel="Home"
      />

      <ul className="grid gap-5 lg:grid-cols-3">
        {exampleShowcases.map((example) => (
          <li key={example.title}>
            <article className="holo-card p-5 sm:p-6 h-full flex flex-col">
              <h2 className="font-display font-semibold text-xl" style={{ color: example.accent }}>
                {example.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                <InlineCodeText text={example.description} />
              </p>

              <pre className="mt-4 overflow-x-auto rounded-lg border border-[var(--border-glass)] bg-[var(--bg-glass)] p-3 text-xs leading-6 font-mono text-[var(--text-primary)]">
                <code>
                  {example.commands.map((command) => (
                    <span key={command} className="block whitespace-pre">
                      <span aria-hidden="true" className="select-none" style={{ color: example.accent }}>
                        ${' '}
                      </span>
                      {command}
                    </span>
                  ))}
                </code>
              </pre>

              <a
                href={example.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 self-start text-xs font-mono uppercase tracking-[0.15em] hover:underline"
                style={{ color: example.accent }}
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
