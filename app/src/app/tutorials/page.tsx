import { tutorialTracks } from '@/app/site-content';

export default function TutorialsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono uppercase tracking-[0.3em] text-white/40 mb-4">
          Step By Step
        </div>
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-4">
          <span className="neon-glow-magenta">Tutorials</span>
        </h1>
        <p className="text-white/45 text-base md:text-lg max-w-3xl leading-relaxed">
          Short guided tracks for getting an agent running, adding curated
          capabilities, and wiring in the shared speech runtime without
          fragmenting your configuration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {tutorialTracks.map((track) => (
          <a
            key={track.title}
            href={track.href}
            target="_blank"
            rel="noreferrer noopener"
            className="holo-card p-6 block"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div
                className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-[0.2em]"
                style={{
                  color: track.accent,
                  border: `1px solid ${track.accent}40`,
                  backgroundColor: `${track.accent}12`,
                }}
              >
                {track.level}
              </div>
              <span className="text-white/35 text-xs font-mono">{track.duration}</span>
            </div>
            <h2 className="font-display font-semibold text-2xl mb-3">{track.title}</h2>
            <p className="text-white/45 text-sm leading-relaxed mb-5">
              {track.description}
            </p>
            <ol className="space-y-3 mb-6">
              {track.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-white/55">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs"
                    style={{
                      color: track.accent,
                      border: `1px solid ${track.accent}40`,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: track.accent }}>
              Open Tutorial
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
