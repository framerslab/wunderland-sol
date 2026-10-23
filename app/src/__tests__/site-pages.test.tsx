import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { exampleShowcases, guideSections, tutorialTracks } from '@/app/site-content';

const APP_SRC = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_SRC, '..', '..');
const CLI_DIR = path.join(REPO_ROOT, 'src', 'cli');

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

/** Every `wunderland ...` line the pages show: code spans in the copy plus example commands. */
function shownCommandLines(): string[] {
  const copy = collectStrings([guideSections, tutorialTracks, exampleShowcases]);
  const codeSpans = copy.flatMap((text) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]));
  const exampleCommands = exampleShowcases.flatMap((example) => example.commands);
  return [...new Set([...codeSpans, ...exampleCommands])].filter((line) => line.startsWith('wunderland '));
}

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : listSourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe('site content commands', () => {
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
      expect(source, `"${sub}" is not a subcommand of "wunderland ${command}" (${where})`).toContain(`=== '${sub}'`);
    }

    for (const flag of args.filter((arg) => arg.startsWith('--'))) {
      expect(source, `"wunderland ${command}" does not read ${flag} (${where})`).toContain(`'${flag.slice(2)}'`);
    }

    const preset = args[args.indexOf('--preset') + 1];
    if (args.includes('--preset') && preset && !preset.startsWith('<')) {
      expect(existsSync(path.join(REPO_ROOT, 'presets', 'agents', preset, 'agent.config.json'))).toBe(true);
    }
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
