/**
 * Where `wunderland start` listens.
 *
 * The CLI's own dependencies come from the parent monorepo, so this job
 * cannot import src/cli/commands/start.ts. It binds real servers through the
 * helper start.ts uses and reads start.ts to check that it uses it.
 */
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LISTEN_HOST,
  displayHost,
  isLoopbackHost,
  listenOn,
  resolveListenHost,
} from '../../../src/cli/config/listen-host';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const START_SOURCE = path.join(REPO_ROOT, 'src', 'cli', 'commands', 'start.ts');

const servers: Server[] = [];

function newServer(): Server {
  const server = createServer((_req, res) => res.end('ok'));
  servers.push(server);
  return server;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

describe('wunderland start listen address', () => {
  it('listens on 127.0.0.1 when --host is not given', async () => {
    expect(DEFAULT_LISTEN_HOST).toBe('127.0.0.1');
    const address = await listenOn(newServer(), 0, resolveListenHost(undefined));
    expect(address.address).toBe('127.0.0.1');
  });

  it('listens on the address --host names', async () => {
    const address = await listenOn(newServer(), 0, resolveListenHost('0.0.0.0'));
    expect(address.address).toBe('0.0.0.0');
  });

  it('drops the brackets from an IPv6 --host, which server.listen cannot resolve', () => {
    expect(resolveListenHost('[::1]')).toBe('::1');
    expect(resolveListenHost('::1')).toBe('::1');
    expect(resolveListenHost('[not-an-address]')).toBe('[not-an-address]');
  });

  it('refuses --host without an address instead of guessing one', () => {
    expect(() => resolveListenHost(true)).toThrow(/--host needs an address/);
    expect(() => resolveListenHost('  ')).toThrow(/--host needs an address/);
  });

  it('rejects when the port is taken', async () => {
    const first = await listenOn(newServer(), 0, DEFAULT_LISTEN_HOST);
    await expect(listenOn(newServer(), first.port, DEFAULT_LISTEN_HOST)).rejects.toMatchObject({
      code: 'EADDRINUSE',
    });
  });

  it('tells loopback addresses from addresses other machines can reach', () => {
    for (const host of ['127.0.0.1', '127.0.0.2', 'localhost', '::1', '[::1]']) {
      expect(isLoopbackHost(host), host).toBe(true);
    }
    for (const host of ['0.0.0.0', '::', '192.168.1.20', 'example.com']) {
      expect(isLoopbackHost(host), host).toBe(false);
    }
  });

  it('prints a wildcard address as localhost and brackets IPv6', () => {
    expect(displayHost('0.0.0.0')).toBe('localhost');
    expect(displayHost('::')).toBe('localhost');
    expect(displayHost('127.0.0.1')).toBe('127.0.0.1');
    expect(displayHost('::1')).toBe('[::1]');
  });

  it('start.ts listens through the helper on the --host address, never a fixed 0.0.0.0', () => {
    const source = readFileSync(START_SOURCE, 'utf8');
    expect(source).not.toContain("'0.0.0.0'");
    expect(source).toContain("resolveListenHost(flags['host'])");
    expect(source).toContain('listenOn(server, port, host)');
  });
});
