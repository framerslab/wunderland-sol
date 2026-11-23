import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// @framers/agentos declares the lowest Node it runs on in engines.node. No CI
// job builds the Docker images or follows the setup steps in the docs, so an
// image or a page that names an older Node only breaks for whoever follows it.
// This test reads the floor from the installed package and checks every Node
// major those files name.

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(backendRoot, '..');

function agentosNodeFloor(): number {
  const candidates = [
    resolve(backendRoot, 'node_modules/@framers/agentos/package.json'),
    resolve(repoRoot, 'node_modules/@framers/agentos/package.json'),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error(`@framers/agentos is not installed (looked in ${candidates.join(', ')})`);
  const range = (JSON.parse(readFileSync(found, 'utf8')) as { engines?: { node?: string } }).engines
    ?.node;
  const match = /^\s*>=\s*v?(\d+)/.exec(range ?? '');
  if (!match) throw new Error(`cannot read a Node floor from @framers/agentos engines.node "${range}"`);
  return Number(match[1]);
}

// Each pattern captures a Node major in its first group.
const FROM_NODE = /^[ \t]*FROM[ \t]+(?:--\S+[ \t]+)*(?:\S+\/)?node:(\d+)/gim;
const DOC_PATTERNS = [
  FROM_NODE,
  // actions/setup-node in a workflow example
  /(?:node-version|NODE_VERSION):\s*["']?(\d+)/g,
  // the NodeSource install script
  /deb\.nodesource\.com\/setup_(\d+)\.x/g,
  // prerequisites prose: "Node.js 20+", "**Node.js** 18 or later", "Node.js >= 18.0.0"
  /Node\.js\W{0,6}(\d+)/g,
];

type Pin = { where: string; major: number };

function pinsIn(file: string, patterns: RegExp[]): Pin[] {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const pins: Pin[] = [];
  for (const pattern of patterns) {
    for (const m of text.matchAll(new RegExp(pattern.source, pattern.flags))) {
      const lineNo = text.slice(0, m.index ?? 0).split('\n').length;
      pins.push({
        where: `${relative(repoRoot, file)}:${lineNo}: ${(lines[lineNo - 1] ?? '').trim()}`,
        major: Number(m[1]),
      });
    }
  }
  return pins;
}

function markdownUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return markdownUnder(p);
    return /\.mdx?$/.test(e.name) ? [p] : [];
  });
}

describe('Node named by the Docker images and the docs', () => {
  const floor = agentosNodeFloor();

  it.each([
    'app/Dockerfile',
    'backend/Dockerfile',
    'deployment/Dockerfile.frontend',
    'docs-site/docs/deployment/self-hosting.md',
  ])('%s builds on a Node image at or above the @framers/agentos floor', (file) => {
    const pins = pinsIn(resolve(repoRoot, file), [FROM_NODE]);
    // A file with no FROM node line would pass the check below without reading anything.
    expect(pins.length, `${file} has no FROM node:<major> line; update this test`).toBeGreaterThan(0);
    expect(pins.filter((p) => p.major < floor).map((p) => p.where)).toEqual([]);
  });

  it('the README and the docs site name no Node major below the @framers/agentos floor', () => {
    const files = [resolve(repoRoot, 'README.md'), ...markdownUnder(resolve(repoRoot, 'docs-site/docs'))];
    const pins = files.flatMap((f) => pinsIn(f, DOC_PATTERNS));
    expect(pins.length, 'no Node version found in the docs; update this test').toBeGreaterThan(0);
    expect(pins.filter((p) => p.major < floor).map((p) => p.where)).toEqual([]);
  });
});
