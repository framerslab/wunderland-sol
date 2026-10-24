import type { Metadata } from 'next';
import { PageContainer, SectionHeader } from '@/components/layout';
import { InlineCodeText } from '@/components/InlineCodeText';
import { guideSections } from '@/app/site-content';

const TITLE = 'Wunderland CLI Guides';
const DESCRIPTION =
  'Guides for the Wunderland CLI, from installing it and saving provider keys to adding extensions and voice, choosing a security tier and running an agent on your machine.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/guides' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/guides',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: TITLE }],
  },
};

function sectionId(title: string): string {
  return `guides-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

export default function GuidesPage() {
  return (
    <PageContainer size="wide">
      <SectionHeader
        title="Guides"
        subtitle="Docs for each step, from installing the CLI to running an agent as a local server. Each card opens the matching page on docs.wunderland.sh."
        gradient="cyan"
        backHref="/"
        backLabel="Home"
      />

      <div className="space-y-10">
        {guideSections.map((section) => (
          <section key={section.title} aria-labelledby={sectionId(section.title)}>
            <h2
              id={sectionId(section.title)}
              className="font-display font-semibold text-lg sm:text-xl text-[var(--text-primary)]"
            >
              {section.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)] leading-relaxed">{section.description}</p>

            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.cards.map((card) => (
                <li key={card.title}>
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="holo-card p-5 h-full flex flex-col"
                  >
                    <span aria-hidden="true" className="block w-10 h-1 rounded-full mb-4" style={{ backgroundColor: card.accent }} />
                    <h3 className="font-display font-semibold text-base text-[var(--text-primary)]">{card.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                      <InlineCodeText text={card.description} />
                    </p>
                    <span className="mt-4 text-xs font-mono uppercase tracking-[0.15em]" style={{ color: card.accent }}>
                      {card.label} <span aria-hidden="true">&#8599;</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
