import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/guides',
  useRouter: () => ({ push: () => undefined }),
}));
vi.mock('@/components/WalletButton', () => ({ WalletButton: () => null }));

import ExamplesPage from '@/app/examples/page';
import GuidesPage from '@/app/guides/page';
import { exampleShowcases, guideSections, tutorialTracks } from '@/app/site-content';
import sitemap from '@/app/sitemap';
import TutorialsPage from '@/app/tutorials/page';
import { AppShell, DOCS_MENU_ITEMS } from '@/components/AppShell';

const APP_SRC = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_SRC, '..', '..');
const CLI_DIR = path.join(REPO_ROOT, 'src', 'cli');
const DOCS_SITE = 'https://docs.wunderland.sh/';

/** Maps each command in the COMMANDS registry of src/cli/index.ts to its source file. */
function readCliRegistry(): Map<string, string> {
  const index = readFileSync(path.join(CLI_DIR, 'index.ts'), 'utf8');
  const start = index.indexOf('const COMMANDS');
  const registry = index.slice(start, index.indexOf('\n};', start));
  const commands = new Map<string, string>();
  for (const match of registry.matchAll(/'?([a-z][a-z-]*)'?:\s*\(\)\s*=>\s*import\('\.\/(commands\/[\w-]+)\.js'\)/g)) {
    commands.set(match[1], path.join(CLI_DIR, `${match[2]}.ts`));
  }
  return commands;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

const siteCopy = collectStrings([guideSections, tutorialTracks, exampleShowcases]);

function codeSpans(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

/** Every `wunderland ...` line the pages show: code spans in the copy plus example commands. */
function shownCommandLines(): string[] {
  const exampleCommands = exampleShowcases.flatMap((example) => example.commands);
  return [...new Set([...siteCopy.flatMap(codeSpans), ...exampleCommands])].filter((line) =>
    line.startsWith('wunderland '),
  );
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

/** Text as React escapes it in markup. */
function html(text: string): string {
  return renderToStaticMarkup(<>{text}</>);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pageFileFor(href: string): string {
  const route = href.split(/[?#]/)[0].replace(/^\/|\/$/g, '');
  return path.join(APP_SRC, 'app', route, 'page.tsx');
}

describe('site content', () => {
  const registry = readCliRegistry();
  const lines = shownCommandLines();

  it('finds the CLI registry and the commands the pages show', () => {
    expect(registry.get('chat')).toBe(path.join(CLI_DIR, 'commands', 'chat.ts'));
    expect(lines.length).toBeGreaterThan(0);
  });

  it.each(lines)('`%s` runs a command, subcommand and flags that src/cli handles', (line) => {
    const [, command, ...args] = line.split(/\s+/);
    const file = registry.get(command);
    expect(file, `"wunderland ${command}" is not in the COMMANDS registry of src/cli/index.ts`).toBeDefined();
    const source = readFileSync(file as string, 'utf8');
    const where = path.relative(REPO_ROOT, file as string);

    const sub = args[0];
    if (sub && /^[a-z][a-z-]*$/.test(sub) && /const sub(?:command)? = args\[0\]/.test(source)) {
      expect(source.includes(`=== '${sub}'`), `"${sub}" is not a subcommand of "wunderland ${command}" (${where})`).toBe(true);
    }

    for (const flag of args.filter((arg) => arg.startsWith('--'))) {
      expect(source.includes(`'${flag.slice(2)}'`), `"wunderland ${command}" does not read ${flag} (${where})`).toBe(true);
    }

    const preset = args[args.indexOf('--preset') + 1];
    if (args.includes('--preset') && preset && !preset.startsWith('<')) {
      const presetConfig = path.join(REPO_ROOT, 'presets', 'agents', preset, 'agent.config.json');
      expect(existsSync(presetConfig), `no agent preset "${preset}" in presets/agents`).toBe(true);
    }
  });

  it('closes every code span it opens', () => {
    expect(siteCopy.filter((text) => (text.match(/`/g)?.length ?? 0) % 2 === 1)).toEqual([]);
  });

  it('links every card to the docs site', () => {
    const hrefs = [
      ...guideSections.flatMap((section) => section.cards.map((card) => card.href)),
      ...tutorialTracks.map((track) => track.href),
      ...exampleShowcases.map((example) => example.href),
    ];
    expect(hrefs.filter((href) => !href.startsWith(DOCS_SITE))).toEqual([]);
  });
});

describe('links into this repository', () => {
  it('point at master', () => {
    const offenders = listSourceFiles(APP_SRC).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/github\.com\/framerslab\/wunderland-sol\/(?:blob|tree)\/([^/\s'"`]+)/g)]
        .filter((match) => match[1] !== 'master')
        .map((match) => `${path.relative(REPO_ROOT, file)}: ${match[0]}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe('/guides', () => {
  const markup = renderToStaticMarkup(<GuidesPage />);

  it('has one h1 and an h2 per section', () => {
    expect(markup.match(/<h1\b/g)).toHaveLength(1);
    for (const section of guideSections) {
      expect(markup).toMatch(new RegExp(`<h2[^>]*>${escapeRegExp(html(section.title))}</h2>`));
    }
  });

  it('renders every card as a link that opens the docs in a new tab', () => {
    for (const card of guideSections.flatMap((section) => section.cards)) {
      expect(markup).toContain(`<a href="${card.href}" target="_blank" rel="noopener noreferrer"`);
      expect(markup).toContain(html(card.title));
      expect(markup).toContain(html(card.label));
      for (const span of codeSpans(card.description)) {
        expect(markup).toMatch(new RegExp(`<code[^>]*>${escapeRegExp(html(span))}</code>`));
      }
    }
  });
});

describe('/tutorials', () => {
  const markup = renderToStaticMarkup(<TutorialsPage />);

  it('renders every track with its level, steps and docs link', () => {
    expect(markup.match(/<h1\b/g)).toHaveLength(1);
    for (const track of tutorialTracks) {
      expect(markup).toContain(html(track.title));
      expect(markup).toContain(html(track.level));
      expect(markup).toContain(`href="${track.href}" target="_blank" rel="noopener noreferrer"`);
      for (const step of track.steps) {
        const plain = step.replace(/`/g, '');
        expect(markup.replace(/<[^>]+>/g, '')).toContain(html(plain));
      }
      for (const span of track.steps.flatMap(codeSpans)) {
        expect(markup).toMatch(new RegExp(`<code[^>]*>${escapeRegExp(html(span))}</code>`));
      }
    }
  });
});

describe('/examples', () => {
  const markup = renderToStaticMarkup(<ExamplesPage />);

  it('renders every example with its commands and docs link', () => {
    expect(markup.match(/<h1\b/g)).toHaveLength(1);
    for (const example of exampleShowcases) {
      expect(markup).toContain(html(example.title));
      expect(markup).toContain(`href="${example.href}" target="_blank" rel="noopener noreferrer"`);
      for (const command of example.commands) {
        expect(markup).toContain(`</span>${html(command)}</span>`);
      }
    }
  });
});

describe('navigation', () => {
  it('points the Docs menu at pages that exist and at the docs site', () => {
    for (const item of DOCS_MENU_ITEMS) {
      if (item.external) {
        expect(item.href.startsWith('https://docs.wunderland.sh')).toBe(true);
      } else {
        expect(existsSync(pageFileFor(item.href)), `${item.href} has no page.tsx`).toBe(true);
      }
    }
    expect(DOCS_MENU_ITEMS.filter((item) => !item.external).map((item) => item.href)).toEqual([
      '/guides',
      '/tutorials',
      '/examples',
    ]);
  });

  it('shows a Docs menu on desktop and the three pages in the mobile menu and footer', () => {
    const markup = renderToStaticMarkup(
      <AppShell>
        <p>page</p>
      </AppShell>,
    );
    // usePathname() is mocked to /guides, so the Docs menu button is the active one.
    expect(markup).toMatch(/<button[^>]*class="[^"]*\bnav-link--active\b[^"]*"[^>]*aria-controls="docs-menu"[^>]*>Docs</);
    for (const href of ['/guides', '/tutorials', '/examples']) {
      expect(markup.match(new RegExp(`href="${href}"`, 'g')) ?? []).toHaveLength(2);
    }
  });
});

describe('sitemap', () => {
  it('lists the guides, tutorials and examples pages', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('backend offline in tests')));
    try {
      const paths = (await sitemap()).map((entry) => new URL(entry.url).pathname);
      expect(paths).toEqual(expect.arrayContaining(['/guides', '/tutorials', '/examples']));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
