/**
 * Copy for the /guides, /tutorials and /examples pages.
 *
 * Cards link to docs.wunderland.sh. Commands and behaviour described here
 * follow the CLI in src/cli (bin/wunderland.js runs its build), and
 * src/__tests__/site-pages.test.tsx checks every `wunderland ...` line
 * against that CLI's command registry.
 */

export interface SiteCardLink {
  title: string;
  description: string;
  href: string;
  label: string;
  accent: string;
}

export interface SiteSection {
  title: string;
  description: string;
  cards: SiteCardLink[];
}

export interface TutorialTrack {
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
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

const DOCS = 'https://docs.wunderland.sh/docs';

export const guideSections: SiteSection[] = [
  {
    title: 'Start Here',
    description: 'Install the CLI, save your provider keys and scaffold a first agent project.',
    cards: [
      {
        title: 'Installation',
        description:
          'Install the `wunderland` CLI from npm, then run `wunderland setup` to save your provider keys.',
        href: `${DOCS}/getting-started/installation`,
        label: 'Read the install guide',
        accent: 'var(--neon-cyan)',
      },
      {
        title: 'Quickstart',
        description:
          'Scaffold a project with `wunderland init my-agent`, then run `wunderland chat` inside it to talk to the agent in your terminal.',
        href: `${DOCS}/getting-started/quickstart`,
        label: 'Open the quickstart',
        accent: 'var(--neon-green)',
      },
      {
        title: 'Configuration',
        description:
          'Keys and defaults live in `~/.wunderland`. Each agent keeps its personality, skills and security tier in `agent.config.json`.',
        href: `${DOCS}/getting-started/configuration`,
        label: 'Read the config guide',
        accent: 'var(--neon-magenta)',
      },
    ],
  },
  {
    title: 'Build & Runtime',
    description: 'Embed the runtime in your own app, add extensions, and choose voice and model providers.',
    cards: [
      {
        title: 'Library API',
        description: 'Import the `wunderland` package to run agents inside your own Node.js app instead of the CLI.',
        href: `${DOCS}/guides/library-first-api`,
        label: 'Read the library guide',
        accent: 'var(--sol-purple)',
      },
      {
        title: 'Extensions',
        description:
          'List curated extensions with `wunderland extensions`, inspect one with `wunderland extensions info <name>`, and switch it on or off with `wunderland extensions enable <name>` or `wunderland extensions disable <name>`.',
        href: `${DOCS}/guides/extensions`,
        label: 'Read the extensions guide',
        accent: 'var(--neon-cyan)',
      },
      {
        title: 'Capability Discovery',
        description:
          'Run `wunderland chat --lazy-tools` to start with only the schema-on-demand meta tools. The agent enables extension packs as it needs them.',
        href: `${DOCS}/guides/capability-discovery`,
        label: 'Read about discovery',
        accent: 'var(--neon-green)',
      },
      {
        title: 'Voice',
        description:
          'Turn on ElevenLabs text-to-speech in the Advanced setup wizard. `wunderland voice` shows which phone-call providers have credentials.',
        href: `${DOCS}/guides/voice-runtime`,
        label: 'Read the voice guide',
        accent: 'var(--neon-gold)',
      },
      {
        title: 'LLM Providers',
        description:
          '`wunderland chat` runs on OpenAI, Anthropic, OpenRouter or a local Ollama model, and `wunderland models test` checks a connection.',
        href: `${DOCS}/guides/model-providers`,
        label: 'Compare providers',
        accent: 'var(--sol-purple)',
      },
    ],
  },
  {
    title: 'Integrations & Operations',
    description: 'Connect channels, choose which tool calls need your approval, and run the agent as a local server.',
    cards: [
      {
        title: 'Channels',
        description:
          'List configured channels with `wunderland channels`, add Telegram, Discord, Slack, WhatsApp or another with `wunderland channels add <platform>`, and remove one with `wunderland channels remove <platform>`.',
        href: `${DOCS}/guides/channels`,
        label: 'Read the channels guide',
        accent: 'var(--neon-magenta)',
      },
      {
        title: 'CLI Command Reference',
        description: 'Commands and flags for setup, chat, extensions, voice and diagnostics.',
        href: `${DOCS}/api/cli-reference`,
        label: 'Open the CLI reference',
        accent: 'var(--neon-cyan)',
      },
      {
        title: 'Local-First Deployment',
        description:
          'Start on your own machine, where `wunderland start` serves `GET /health` and `POST /chat` on 127.0.0.1 port 3777.',
        href: `${DOCS}/deployment/local-first`,
        label: 'Read the deployment guide',
        accent: 'var(--neon-green)',
      },
      {
        title: 'Security & Approvals',
        description: 'Five security tiers, from dangerous to paranoid, decide which tool calls wait for your approval.',
        href: `${DOCS}/guides/security`,
        label: 'Read the security guide',
        accent: 'var(--neon-gold)',
      },
    ],
  },
];

export const tutorialTracks: TutorialTrack[] = [
  {
    title: 'Launch Your First Agent',
    level: 'Beginner',
    description: 'Install the CLI, scaffold a project and hold a first conversation with `wunderland chat`.',
    href: `${DOCS}/tutorials/first-agent`,
    accent: 'var(--neon-cyan)',
    steps: [
      'Install the CLI with `npm install -g wunderland`.',
      'Run `wunderland init my-agent` and pick an LLM provider and model when it asks.',
      'Run `cd my-agent`, then `wunderland chat` to talk to the agent in your terminal.',
    ],
  },
  {
    title: 'Build an Agent from a Preset',
    level: 'Intermediate',
    description: 'Start from a preset, add skills and extensions, then run the health check and seal the config.',
    href: `${DOCS}/guides/creating-agents`,
    accent: 'var(--sol-purple)',
    steps: [
      'List the presets with `wunderland list-presets`, then scaffold one with `wunderland init my-agent --preset research-assistant`.',
      'Inside the project, add skills with `wunderland skills enable <name>` and extensions with `wunderland extensions enable <name>`.',
      'Run `wunderland doctor` to check keys and connectivity, then `wunderland seal` to record a SHA-256 hash of the config.',
    ],
  },
  {
    title: 'Add Voice to an Agent',
    level: 'Intermediate',
    description: 'Give an agent ElevenLabs text-to-speech and check your phone-call providers.',
    href: `${DOCS}/tutorials/voice-agent`,
    accent: 'var(--neon-gold)',
    steps: [
      'Run `wunderland setup`, choose Advanced, and say yes to voice synthesis with ElevenLabs.',
      'The wizard saves `ELEVENLABS_API_KEY`. When `agent.config.json` lists no extensions, `wunderland chat` loads the voice-synthesis extension with that key.',
      'Run `wunderland voice status` to see whether Twilio, Telnyx and Plivo have credentials for phone calls.',
    ],
  },
  {
    title: 'Run a Local Agent Server',
    level: 'Advanced',
    description: 'Serve an agent over HTTP on your own machine before you host it anywhere else.',
    href: `${DOCS}/deployment/local-first`,
    accent: 'var(--neon-green)',
    steps: [
      'Scaffold the agent with `wunderland init my-agent` and put an `OPENAI_API_KEY` in the project `.env`.',
      'Run `wunderland start` in the project. It serves `GET /health` and `POST /chat` on 127.0.0.1 port 3777, so only this machine can reach it. `--port` picks another port.',
      'Check it with `curl http://127.0.0.1:3777/health`, then send a message to `/chat`.',
      '`/chat` answers without a sign-in by default, which is why the server stays on 127.0.0.1. `wunderland start --host <address>` listens on another address; the docs linked below say how to secure it first.',
    ],
  },
];

export const exampleShowcases: ExampleShowcase[] = [
  {
    title: 'Research Copilot',
    description:
      'The research-assistant preset sets the balanced security tier and the web-search, summarize and GitHub skills. `wunderland chat` also loads the default extensions, which include web search and a headless browser.',
    href: `${DOCS}/use-cases/deep-research-agent`,
    accent: 'var(--neon-cyan)',
    commands: [
      'wunderland init research-copilot --preset research-assistant',
      'cd research-copilot',
      'wunderland chat',
    ],
  },
  {
    title: 'Voice Concierge',
    description:
      'An assistant with ElevenLabs text-to-speech from the Advanced setup wizard, and a check of which phone-call providers have credentials.',
    href: `${DOCS}/use-cases/voice-concierge`,
    accent: 'var(--neon-gold)',
    commands: ['wunderland setup', 'wunderland chat', 'wunderland voice status'],
  },
  {
    title: 'Ops Assistant',
    description:
      'The devops-assistant preset sets the strict security tier, the shell executor and browser extensions, and the healthcheck, coding-agent and GitHub skills. `wunderland init` writes those extensions into `agent.config.json`, and `wunderland chat` loads them in place of its default set.',
    href: `${DOCS}/guides/preset-agents`,
    accent: 'var(--sol-purple)',
    commands: ['wunderland init ops-agent --preset devops-assistant', 'cd ops-agent', 'wunderland chat'],
  },
];
