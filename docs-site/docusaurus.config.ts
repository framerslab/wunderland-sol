import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'WUNDERLAND Docs',
  tagline: 'Free open-source OpenClaw fork — secure npm CLI for autonomous AI agents with 5-tier prompt-injection defense, AgentOS integrations, HEXACO personalities, and Solana provenance',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.wunderland.sh',
  baseUrl: '/',

  organizationName: 'manicinc',
  projectName: 'wunderland-sol',

  onBrokenLinks: 'warn',
  trailingSlash: false,

  markdown: {
    format: 'detect',
    mermaid: true,
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  clientModules: ['./src/theme-sync.js'],

  headTags: [
    {
      tagName: 'meta',
      attributes: { name: 'keywords', content: 'OpenClaw fork, OpenClaw alternative, secure OpenClaw, AI agents, npm CLI, agent security, prompt injection defense, HEXACO, AgentOS, Solana, autonomous agents, Wunderland, sandboxed agents, wunderland docs, wunderland documentation, ai agent framework' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'description', content: 'Official documentation for Wunderland — a security-hardened OpenClaw fork for building autonomous AI agents with HEXACO personalities, 5-tier prompt injection defense, and Solana provenance.' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'googlebot', content: 'index, follow' },
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'typedoc-public',
        entryPoints: ['.source/wunderland/src/index.ts'],
        tsconfig: '.source/wunderland/tsconfig.json',
        out: 'docs/api-reference/public',
        exclude: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/tests/**'],
        sidebar: {
          autoConfiguration: true,
          pretty: true,
        },
        validation: {
          notExported: false,
        },
        skipErrorChecking: true,
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'typedoc-internal',
        entryPoints: [
          '.source/wunderland/src/api/index.ts',
          '.source/wunderland/src/agency/index.ts',
          '.source/wunderland/src/authorization/index.ts',
          '.source/wunderland/src/browser/index.ts',
          '.source/wunderland/src/core/index.ts',
          '.source/wunderland/src/discovery/index.ts',
          '.source/wunderland/src/evaluation/index.ts',
          '.source/wunderland/src/inference/index.ts',
          '.source/wunderland/src/jobs/index.ts',
          '.source/wunderland/src/knowledge/index.ts',
          '.source/wunderland/src/marketplace/index.ts',
          '.source/wunderland/src/pairing/index.ts',
          '.source/wunderland/src/planning/index.ts',
          '.source/wunderland/src/provenance/index.ts',
          '.source/wunderland/src/rag/index.ts',
          '.source/wunderland/src/scheduling/index.ts',
          '.source/wunderland/src/security/index.ts',
          '.source/wunderland/src/skills/index.ts',
          '.source/wunderland/src/social/index.ts',
          '.source/wunderland/src/storage/index.ts',
          '.source/wunderland/src/structured/index.ts',
          '.source/wunderland/src/tools/index.ts',
          '.source/wunderland/src/runtime/index.ts',
          '.source/wunderland/src/workflows/index.ts',
        ],
        tsconfig: '.source/wunderland/tsconfig.json',
        out: 'docs/api-reference/modules',
        readme: 'none',
        exclude: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**', '**/tests/**'],
        sidebar: {
          autoConfiguration: true,
          pretty: true,
        },
        validation: {
          notExported: false,
        },
        skipErrorChecking: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/manicinc/wunderland-sol/tree/master/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/wunderland-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'WUNDERLAND',
      logo: {
        alt: 'Wunderland Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://wunderland.sh',
          label: 'App',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/wunderland',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/jddunn/wunderland',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'Getting Started', to: '/docs/'},
            {label: 'Architecture', to: '/docs/architecture/overview'},
            {label: 'Guides', to: '/docs/guides/creating-agents'},
            {label: 'API Reference', to: '/docs/api/overview'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub', href: 'https://github.com/jddunn/wunderland'},
            {label: 'Discord', href: 'https://discord.gg/KxF9b6HY6h'},
            {label: 'Twitter', href: 'https://twitter.com/wunderlandsh'},
          ],
        },
        {
          title: 'Related',
          items: [
            {label: 'Wunderland App', href: 'https://wunderland.sh'},
            {label: 'AgentOS', href: 'https://agentos.sh'},
            {label: 'AgentOS Docs', href: 'https://docs.agentos.sh'},
          ],
        },
      ],
      copyright: `Copyright \u00a9 ${new Date().getFullYear()} Wunderland. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'json', 'bash', 'solidity'],
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
