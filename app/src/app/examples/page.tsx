import { exampleShowcases } from '@/app/site-content';

export default function ExamplesPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono uppercase tracking-[0.3em] text-white/40 mb-4">
          Copy From Here
        </div>
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-4">
          <span className="neon-glow-green">Examples</span>
        </h1>
        <p className="text-white/45 text-base md:text-lg max-w-3xl leading-relaxed">
          Working starting points for the patterns people actually need:
          research, voice interaction, and scheduled autonomous operations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {exampleShowcases.map((example) => (
          <a
            key={example.title}
            href={example.href}
            target="_blank"
            rel="noreferrer noopener"
            className="holo-card p-6 block"
          >
            <div
              className="inline-flex px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.2em] mb-4"
              style={{
                color: example.accent,
                border: `1px solid ${example.accent}40`,
                backgroundColor: `${example.accent}10`,
              }}
            >
              Starter
            </div>
            <h2 className="font-display font-semibold text-2xl mb-3">{example.title}</h2>
            <p className="text-white/45 text-sm leading-relaxed mb-5">
              {example.description}
            </p>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4 mb-5">
              <div className="font-mono text-[11px] text-white/60 space-y-2">
                {example.commands.map((command) => (
                  <div key={command} className="overflow-x-auto whitespace-nowrap">
                    <span style={{ color: example.accent }}>$</span> {command}
                  </div>
                ))}
              </div>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: example.accent }}>
              Open Example Docs
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
