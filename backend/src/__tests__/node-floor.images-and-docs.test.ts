import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// @framers/agentos declares the lowest Node it runs on in engines.node. No CI
// job builds the Docker images or runs the deployment examples in the docs, so
// an image or an example pinned below that floor only breaks for whoever
// builds it. This test reads the floor from the installed package and checks
// every Node major those files pin.

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

const FROM_NODE = /^\s*FROM\s+(?:--\S+\s+)*(?:\S+\/)?node:(\d+)/gim;
const SETUP_NODE = /(?:node-version|NODE_VERSION):\s*["']?(\d+)/g;

// Each file and the pattern whose first group is a pinned Node major.
const pinned: Array<{ file: string; pattern: RegExp }> = [
  { file: 'app/Dockerfile', pattern: FROM_NODE },
  { file: 'backend/Dockerfile', pattern: FROM_NODE },
  { file: 'deployment/Dockerfile.frontend', pattern: FROM_NODE },
  { file: 'docs-site/docs/deployment/self-hosting.md', pattern: FROM_NODE },
  { file: 'docs-site/docs/deployment/cloud-hosting.md', pattern: SETUP_NODE },
];

function pinnedMajors(file: string, pattern: RegExp): Array<{ line: string; major: number }> {
  const text = readFileSync(resolve(repoRoot, file), 'utf8');
  return [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map((m) => ({
    line: m[0].trim(),
    major: Number(m[1]),
  }));
}

describe('Node pinned by the Docker images and the deployment docs', () => {
  const floor = agentosNodeFloor();

  it.each(pinned)('$file pins Node at or above the @framers/agentos floor', ({ file, pattern }) => {
    const majors = pinnedMajors(file, pattern);
    // A file that pins nothing would pass the check below without reading anything.
    expect(majors.length, `${file} pins no Node major; update this test`).toBeGreaterThan(0);
    expect(majors.filter((m) => m.major < floor).map((m) => m.line)).toEqual([]);
  });
});
