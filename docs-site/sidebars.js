const typedocSidebar = require('./docs/api-reference/typedoc-sidebar.cjs');

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
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
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/creating-agents',
        'guides/cli-reference',
        'guides/llm-providers',
        'guides/local-llm-setup',
        'guides/library-first-api',
        'guides/extensions',
        'guides/capability-discovery',
        'guides/channels',
        'guides/voice-runtime',
        'guides/scheduling',
        'guides/security',
        'guides/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Use Cases',
      items: [
        'use-cases/autonomous-web-agent',
        'use-cases/deep-research-agent',
        'use-cases/voice-concierge',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment/local-first'],
    },
  ],
  apiSidebar: [
    'api/overview',
    'api/cli-reference',
    ...typedocSidebar,
  ],
};
