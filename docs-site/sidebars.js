// @ts-check

// Try to import TypeDoc-generated sidebars (may not exist on first build)
let publicTypedocSidebarItems = [];
let internalTypedocSidebarItems = [];
try {
  const loaded = require('./docs/api-reference/public/typedoc-sidebar.cjs');
  publicTypedocSidebarItems = Array.isArray(loaded) ? loaded : loaded?.items ?? [];
} catch {
  // Public TypeDoc sidebar not yet generated — will be created during build
}

try {
  const loaded = require('./docs/api-reference/modules/typedoc-sidebar.cjs');
  internalTypedocSidebarItems = Array.isArray(loaded) ? loaded : loaded?.items ?? [];
} catch {
  // Internal TypeDoc sidebar not yet generated — will be created during build
}

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quickstart',
        'getting-started/configuration',
        'getting-started/agent-config-reference',
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorials/first-agent',
        'tutorials/voice-agent',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/agentos-integration',
        'architecture/personality-system',
        'architecture/solana-integration',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/creating-agents',
        'guides/cli-reference',
        'guides/library-first-api',
        'guides/hexaco-personality',
        'guides/memory-system',
        'guides/memory-architecture',
        'guides/security-pipeline',
        'guides/inference-routing',
        'guides/step-up-authorization',
        'guides/social-features',
        'guides/agentic-engagement',
        'guides/browser-automation',
        'guides/skills-system',
        'guides/tools',
        'guides/scheduling',
        'guides/guardrails',
        'guides/on-chain-features',
        'guides/earnings-and-payouts',
        'guides/job-board',
        'guides/ollama-local',
        'guides/env-import',
        'guides/channels',
        'guides/immutability',
        'guides/extensions',
        'guides/extension-configuration',
        'guides/hyde-retrieval',
        'guides/stealth-browser',
        'guides/image-generation',
        'guides/tool-failure-learning',
        'guides/capability-discovery',
        'guides/discovery-configuration',
        'guides/pairing',
        'guides/deep-research',
        'guides/http-streaming-api',
        'guides/chat-server',
        'guides/preset-agents',
        'guides/style-adaptation',
        'guides/llm-sentiment',
        'guides/model-providers',
        'guides/gemini-setup',
        'guides/openai-oauth',
        'guides/full-channel-list',
        'guides/voice-runtime',
        'guides/security',
        'guides/security-tiers',
        'guides/operational-safety',
        'guides/agent-signer',
        'guides/program-upgradeability',
        'guides/ipfs-storage',
        'guides/devlog-mood-analysis',
        'guides/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Use Cases',
      items: [
        'use-cases/autonomous-web-agent',
        'use-cases/social-media-automation',
        'use-cases/deep-research-agent',
        'use-cases/voice-concierge',
        'use-cases/lead-generation-pipeline',
        'use-cases/competitive-intelligence',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/devnet-go-live',
        'deployment/self-hosting',
        'deployment/cloud-hosting',
        'deployment/environment-variables',
        'deployment/local-first',
      ],
    },
    'development-diary',
  ],

  apiSidebar: [
    'api/overview',
    'api/cli-reference',
    {
      type: 'category',
      label: 'Public API',
      items: publicTypedocSidebarItems,
    },
    {
      type: 'category',
      label: 'Internal Modules',
      items: internalTypedocSidebarItems,
    },
  ],
};

module.exports = sidebars;
