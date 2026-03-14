export interface SiteCardLink {
  title: string;
  description: string;
  href: string;
  label: string;
  accent: string;
  external?: boolean;
  bullets?: string[];
}

export interface SiteSection {
  title: string;
  description: string;
  cards: SiteCardLink[];
}

export interface TutorialTrack {
  title: string;
  duration: string;
  level: string;
  description: string;
  href: string;
  accent: string;
  steps: string[];
}

export interface ExampleShowcase {
  title: string;
  description: string;
  href: string;
  accent: string;
  commands: string[];
}

export const onboardingCards: SiteCardLink[] = [
  {
    title: 'Get Started',
    description:
      'Install the CLI, run the setup wizard, and launch your first local Wunderland agent.',
    href: 'https://docs.wunderland.sh/docs/getting-started/installation',
    label: 'Install + Setup',
    accent: 'var(--neon-cyan)',
    external: true,
    bullets: ['npm install -g wunderland', 'wunderland setup', 'wunderland start'],
  },
  {
    title: 'Guides',
    description:
      'Learn the library-first API, channel setup, extensions, discovery, and deployment patterns.',
    href: '/guides',
    label: 'Browse Guides',
    accent: 'var(--sol-purple)',
    bullets: ['Library API', 'Extensions', 'Capability discovery'],
  },
  {
    title: 'Examples',
    description:
      'Copy starting points for research agents, voice agents, and autonomous workflows.',
    href: '/examples',
    label: 'See Examples',
    accent: 'var(--neon-green)',
    bullets: ['Research copilot', 'Voice concierge', 'Scheduled ops agent'],
  },
];

export const guideSections: SiteSection[] = [
  {
    title: 'Start Here',
    description:
      'The minimum path from zero to a running agent, both as a CLI app and as an embedded library.',
    cards: [
      {
        title: 'Installation',
        description: 'Install Wunderland, verify prerequisites, and prepare your first config.',
        href: 'https://docs.wunderland.sh/docs/getting-started/installation',
        label: 'Read Installation',
        accent: 'var(--neon-cyan)',
        external: true,
      },
      {
        title: 'Quickstart',
        description: 'Go from install to a running agent session in a few commands.',
        href: 'https://docs.wunderland.sh/docs/getting-started/quickstart',
        label: 'Open Quickstart',
        accent: 'var(--neon-green)',
        external: true,
      },
      {
        title: 'Configuration',
        description: 'Understand providers, security defaults, presets, and agent config fields.',
        href: 'https://docs.wunderland.sh/docs/getting-started/configuration',
        label: 'View Config Guide',
        accent: 'var(--neon-magenta)',
        external: true,
      },
    ],
  },
  {
    title: 'Build & Runtime',
    description:
      'The core building blocks for local agents, extension loading, discovery, and voice-capable sessions.',
    cards: [
      {
        title: 'Library-First API',
        description: 'Use `createWunderland()` as the high-level runtime entry point in your own app.',
        href: 'https://docs.wunderland.sh/docs/guides/library-first-api',
        label: 'Open Library Guide',
        accent: 'var(--sol-purple)',
        external: true,
      },
      {
        title: 'Extensions',
        description: 'Load curated tools, providers, and runtime packs through the registry.',
        href: 'https://docs.wunderland.sh/docs/guides/extensions',
        label: 'Open Extensions Guide',
        accent: 'var(--neon-cyan)',
        external: true,
      },
      {
        title: 'Capability Discovery',
        description: 'Keep tool exposure narrow and relevant with discovery-driven loading.',
        href: 'https://docs.wunderland.sh/docs/guides/capability-discovery',
        label: 'Learn Discovery',
        accent: 'var(--neon-green)',
        external: true,
      },
      {
        title: 'Speech Runtime',
        description:
          'Wunderland now uses the shared AgentOS `speech-runtime` for STT, TTS, VAD, and provider switching.',
        href: 'https://docs.agentos.sh/docs/features/speech-runtime',
        label: 'Open Speech Runtime Docs',
        accent: 'var(--neon-gold)',
        external: true,
      },
    ],
  },
  {
    title: 'Integrations & Operations',
    description:
      'Connect channels, configure providers, and deploy with current operational defaults.',
    cards: [
      {
        title: 'Channels',
        description: 'Wire agents into messaging platforms and social surfaces.',
        href: 'https://docs.wunderland.sh/docs/guides/channels',
        label: 'Open Channels Guide',
        accent: 'var(--neon-magenta)',
        external: true,
      },
      {
        title: 'CLI Command Reference',
        description: 'Full command surface including setup, chat, voice, extensions, and diagnostics.',
        href: 'https://docs.wunderland.sh/docs/api/cli-reference',
        label: 'Open CLI Reference',
        accent: 'var(--neon-cyan)',
        external: true,
      },
      {
        title: 'Local-First Deployment',
        description: 'Run locally first, then scale into hosted or hybrid deployment targets.',
        href: 'https://docs.wunderland.sh/docs/deployment/local-first',
        label: 'Read Deployment Guide',
        accent: 'var(--neon-green)',
        external: true,
      },
      {
        title: 'AgentOS Integration',
        description: 'See how Wunderland sits on top of AgentOS core, extensions, and skills.',
        href: 'https://docs.wunderland.sh/docs/architecture/agentos-integration',
        label: 'View Architecture',
        accent: 'var(--sol-purple)',
        external: true,
      },
    ],
  },
];

export const tutorialTracks: TutorialTrack[] = [
  {
    title: 'Launch Your First Agent',
    duration: '10 min',
    level: 'Beginner',
    description:
      'Install the CLI, complete setup, run `wunderland chat`, and validate your first agent loop.',
    href: 'https://docs.wunderland.sh/docs/getting-started/quickstart',
    accent: 'var(--neon-cyan)',
    steps: [
      'Install the CLI globally and run `wunderland setup`.',
      'Choose an LLM provider and confirm base config values.',
      'Start the agent, then open an interactive chat session.',
    ],
  },
  {
    title: 'Create a Production-Oriented Agent',
    duration: '20 min',
    level: 'Intermediate',
    description:
      'Start from a preset, layer skills and curated extensions, then tighten discovery and approvals.',
    href: 'https://docs.wunderland.sh/docs/guides/creating-agents',
    accent: 'var(--sol-purple)',
    steps: [
      'Pick a preset that matches your workload.',
      'Add extensions and skills without overloading the runtime.',
      'Review approvals, config sealing, and diagnostics before deployment.',
    ],
  },
  {
    title: 'Add Voice to a Session',
    duration: '15 min',
    level: 'Intermediate',
    description:
      'Use the shared `speech-runtime` abstraction for Whisper-class STT, OpenAI or ElevenLabs TTS, and swappable providers.',
    href: 'https://docs.agentos.sh/docs/extensions/built-in/speech-runtime',
    accent: 'var(--neon-gold)',
    steps: [
      'Enable the `speech-runtime` voice pack instead of legacy voice-only extensions.',
      'Choose STT, TTS, and VAD providers through one high-level config surface.',
      'Validate with the CLI voice commands and keep the same runtime in embedded apps.',
    ],
  },
  {
    title: 'Ship a Local-First Deployment',
    duration: '25 min',
    level: 'Advanced',
    description:
      'Harden the config, choose your provider mix, and move from local execution to hosted deployment.',
    href: 'https://docs.wunderland.sh/docs/deployment/local-first',
    accent: 'var(--neon-green)',
    steps: [
      'Start locally with the exact tools and providers you expect in production.',
      'Tune environment variables, approvals, and discovery fallback behavior.',
      'Promote to a hosted runtime only after local observability looks clean.',
    ],
  },
];

export const exampleShowcases: ExampleShowcase[] = [
  {
    title: 'Research Copilot',
    description:
      'A preset-backed agent that loads search, browser, and summarization capabilities for deep research tasks.',
    href: 'https://docs.wunderland.sh/docs/use-cases/deep-research-agent',
    accent: 'var(--neon-cyan)',
    commands: [
      'wunderland init research-copilot --preset research-assistant',
      'wunderland extensions add web-search web-browser',
      'wunderland chat',
    ],
  },
  {
    title: 'Voice Concierge',
    description:
      'A speech-enabled assistant using the shared runtime for listening, transcription, and TTS playback.',
    href: 'https://docs.agentos.sh/docs/features/speech-runtime',
    accent: 'var(--neon-gold)',
    commands: [
      "extensions: { voice: ['speech-runtime'] }",
      'wunderland voice tts "Welcome to Wunderland"',
      'wunderland voice stt ./samples/check-in.wav',
    ],
  },
  {
    title: 'Scheduled Ops Agent',
    description:
      'An agent that combines workflows, scheduling, and diagnostics for repeatable operational tasks.',
    href: 'https://docs.wunderland.sh/docs/guides/scheduling',
    accent: 'var(--sol-purple)',
    commands: [
      'wunderland workflows create daily-report',
      'wunderland cron add "0 9 * * 1-5" daily-report',
      'wunderland doctor',
    ],
  },
];
