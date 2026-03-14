import { guideSections } from '@/app/site-content';

export default function GuidesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono uppercase tracking-[0.3em] text-white/40 mb-4">
          Build Surface
        </div>
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-4">
          <span className="sol-gradient-text">Guides</span>
          <span className="text-white/70"> for Building with Wunderland</span>
        </h1>
        <p className="text-white/45 text-base md:text-lg max-w-3xl leading-relaxed">
          The shortest path from install to production is: get the CLI running,
          understand the library-first API, then layer extensions, discovery,
          and speech on top of the same runtime.
        </p>
      </div>

      <div className="space-y-12">
        {guideSections.map((section) => (
          <section key={section.title}>
            <div className="mb-5">
              <h2 className="font-display font-bold text-2xl mb-2">{section.title}</h2>
              <p className="text-white/40 max-w-3xl">{section.description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {section.cards.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  target={card.external ? '_blank' : undefined}
                  rel={card.external ? 'noreferrer noopener' : undefined}
                  className="holo-card p-6 block"
                >
                  <div
                    className="w-12 h-1 rounded-full mb-5"
                    style={{ backgroundColor: card.accent }}
                  />
                  <h3 className="font-display font-semibold text-xl mb-2">{card.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed mb-5">
                    {card.description}
                  </p>
                  <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: card.accent }}>
                    {card.label}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="glass mt-12 p-8 rounded-[28px] scan-lines relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,241,149,0.12),transparent_45%)]" />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/35 mb-3">
            Recommended Start
          </p>
          <h2 className="font-display font-bold text-2xl mb-3">
            Start with docs, validate locally, then scale
          </h2>
          <p className="text-white/45 max-w-3xl leading-relaxed mb-6">
            Wunderland is easiest to reason about when you begin with the CLI
            and a local-first config, then mirror the same extensions and
            `speech-runtime` settings inside embedded library usage.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://docs.wunderland.sh/docs/getting-started/installation"
              target="_blank"
              rel="noreferrer noopener"
              className="px-5 py-2.5 rounded-xl sol-gradient text-white font-semibold text-sm"
            >
              Install Wunderland
            </a>
            <a
              href="https://docs.wunderland.sh/docs/api/overview"
              target="_blank"
              rel="noreferrer noopener"
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors text-sm font-semibold"
            >
              Library API
            </a>
            <a
              href="https://docs.agentos.sh/docs/features/speech-runtime"
              target="_blank"
              rel="noreferrer noopener"
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors text-sm font-semibold"
            >
              Speech Runtime
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
