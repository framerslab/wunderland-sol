/**
 * @fileoverview Where `wunderland start` listens.
 *
 * POST /chat has no authentication, so the server listens on the loopback
 * address unless `--host` names another one. `--host 0.0.0.0` opens it to
 * every machine that can reach the port.
 * @module wunderland/cli/config/listen-host
 */

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/** The address `wunderland start` listens on when `--host` is not given. */
export const DEFAULT_LISTEN_HOST = '127.0.0.1';

/**
 * Resolves the `--host` flag. No flag means the loopback default; a flag
 * given without an address is an error, so a typo never widens the server.
 */
export function resolveListenHost(flag: string | boolean | undefined): string {
  if (flag === undefined || flag === false) return DEFAULT_LISTEN_HOST;
  const host = typeof flag === 'string' ? flag.trim() : '';
  if (!host) {
    throw new Error('--host needs an address, for example --host 127.0.0.1 or --host 0.0.0.0');
  }
  return host;
}

/** True when only this machine can reach the address. */
export function isLoopbackHost(host: string): boolean {
  const bare = host.trim().toLowerCase().replace(/^\[(.*)\]$/, '$1');
  return (
    bare === 'localhost' ||
    bare === '::1' ||
    /^127(\.\d{1,3}){3}$/.test(bare) ||
    /^::ffff:127(\.\d{1,3}){3}$/.test(bare)
  );
}

/** The host to print in a URL: a wildcard address prints as localhost. */
export function displayHost(host: string): string {
  if (host === '0.0.0.0' || host === '::') return 'localhost';
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

/** Starts the server on `host:port` and resolves with the address it bound. */
export function listenOn(server: Server, port: number, host: string): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve(server.address() as AddressInfo);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}
