import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

// Each pattern captures a Node major in its first group; a match without one
// is a Node tag the test cannot resolve, and fails the check.
const FROM_NODE = /^[ \t]*FROM[ \t]+(?:--\S+[ \t]+)*(?:\S+\/)?node:(\d+)/gim;
const FROM_NODE_UNRESOLVED = /^[ \t]*FROM[ \t]+(?:--\S+[ \t]+)*(?:\S+\/)?node:\$/gim;
const IMAGE_PATTERNS = [FROM_NODE, FROM_NODE_UNRESOLVED];
const DOC_PATTERNS = [
  ...IMAGE_PATTERNS,
  // actions/setup-node in a workflow example
  /(?:node-version|NODE_VERSION):\s*["']?(\d+)/g,
  // the NodeSource install script
  /deb\.nodesource\.com\/setup_(\d+)\.x/g,
  // prerequisites prose: "Node.js 20+", "**Node.js** 18 or later", "Node.js >= 18.0.0", "Node.js v18"
  /Node\.js\W{0,6}v?(\d+)/g,
];

const KNOWN_IMAGES = ['app/Dockerfile', 'backend/Dockerfile', 'deployment/Dockerfile.frontend'];
const SELF_HOSTING = 'docs-site/docs/deployment/self-hosting.md';

type Pin = { line: number; text: string; major: number | null };

// Put each `ARG NAME=value` default in place of ${NAME} and $NAME, so a FROM
// line that takes its Node tag or its whole image from an ARG is read too.
function withArgDefaults(text: string): string {
  const defaults = new Map<string, string>();
  for (const m of text.matchAll(/^[ \t]*ARG[ \t]+(\w+)=["']?([^"'\s]+)/gim)) {
    defaults.set(m[1], m[2]);
  }
  return text.replace(/\$\{(\w+)\}|\$(\w+)/g, (ref, braced?: string, bare?: string) => {
    return defaults.get((braced ?? bare) as string) ?? ref;
  });
}

function pinsInText(text: string, patterns: RegExp[]): Pin[] {
  const lines = text.split('\n');
  const resolved = withArgDefaults(text);
  const pins: Pin[] = [];
  for (const pattern of patterns) {
    for (const m of resolved.matchAll(new RegExp(pattern.source, pattern.flags))) {
      const line = resolved.slice(0, m.index ?? 0).split('\n').length;
      pins.push({ line, text: (lines[line - 1] ?? '').trim(), major: m[1] ? Number(m[1]) : null });
    }
  }
  return pins;
}

function pinsIn(file: string, patterns: RegExp[]): Array<{ where: string; major: number | null }> {
  return pinsInText(readFileSync(file, 'utf8'), patterns).map((p) => ({
    where: `${relative(repoRoot, file)}:${p.line}: ${p.text}`,
    major: p.major,
  }));
}

// The Dockerfiles under root, relative to it, outside node_modules and dot
// directories.
function dockerfilesUnder(root: string, dir = root): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name === 'node_modules' || e.name.startsWith('.')) return [];
    const p = join(dir, e.name);
    if (e.isDirectory()) return dockerfilesUnder(root, p);
    return e.isFile() && /^Dockerfile(\..+)?$|\.Dockerfile$/.test(e.name) ? [relative(root, p)] : [];
  });
}

function markdownUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return markdownUnder(p);
    return /\.mdx?$/.test(e.name) ? [p] : [];
  });
}

const belowFloor = (floor: number) => (p: { major: number | null }) => p.major === null || p.major < floor;

describe('the Node pin finder', () => {
  const majors = (text: string, patterns: RegExp[]) => pinsInText(text, patterns).map((p) => p.major);

  it('resolves a FROM tag set by an ARG default', () => {
    expect(majors('ARG NODE_VERSION=18\nFROM node:${NODE_VERSION}-alpine AS base\n', IMAGE_PATTERNS)).toEqual([18]);
    expect(majors('ARG NODE_VERSION=18\nFROM node:$NODE_VERSION\n', IMAGE_PATTERNS)).toEqual([18]);
  });

  it('reads a base image named by an ARG default', () => {
    expect(majors('ARG BASE=node:18-alpine\nFROM ${BASE}\n', IMAGE_PATTERNS)).toEqual([18]);
  });

  it('reports a Node tag it cannot resolve', () => {
    expect(majors('FROM node:${NODE_VERSION}\n', IMAGE_PATTERNS)).toEqual([null]);
  });

  it('reads "Node.js v18"', () => {
    expect(majors('- **Node.js v18+**\n', DOC_PATTERNS)).toEqual([18]);
  });

  it('finds every Dockerfile outside node_modules', () => {
    const root = mkdtempSync(join(tmpdir(), 'node-floor-'));
    try {
      for (const f of ['Dockerfile.worker', 'svc/Dockerfile', 'node_modules/pkg/Dockerfile', 'svc/README.md']) {
        mkdirSync(dirname(join(root, f)), { recursive: true });
        writeFileSync(join(root, f), 'FROM node:18\n');
      }
      expect(dockerfilesUnder(root).sort()).toEqual(['Dockerfile.worker', 'svc/Dockerfile']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('Node named by the Docker images and the docs', () => {
  const floor = agentosNodeFloor();

  it('finds the repository images', () => {
    expect(dockerfilesUnder(repoRoot)).toEqual(expect.arrayContaining(KNOWN_IMAGES));
  });

  it.each([...dockerfilesUnder(repoRoot), SELF_HOSTING])(
    '%s builds on a Node image at or above the @framers/agentos floor',
    (file) => {
      const pins = pinsIn(resolve(repoRoot, file), IMAGE_PATTERNS);
      // A known file with no FROM node line would pass the check below without reading anything.
      if ([...KNOWN_IMAGES, SELF_HOSTING].includes(file)) {
        expect(pins.length, `${file} has no FROM node:<major> line; update this test`).toBeGreaterThan(0);
      }
      expect(pins.filter(belowFloor(floor)).map((p) => p.where)).toEqual([]);
    }
  );

  it('the README and the docs site name no Node major below the @framers/agentos floor', () => {
    const files = [resolve(repoRoot, 'README.md'), ...markdownUnder(resolve(repoRoot, 'docs-site/docs'))];
    const pins = files.flatMap((f) => pinsIn(f, DOC_PATTERNS));
    expect(pins.length, 'no Node version found in the docs; update this test').toBeGreaterThan(0);
    expect(pins.filter(belowFloor(floor)).map((p) => p.where)).toEqual([]);
  });
});
