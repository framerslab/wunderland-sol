/**
 * @file unsubscribe-token.ts
 * @description The pieces every agent mail's unsubscribe link is made of:
 * the opaque token, the keyed address, the masked hint the page shows, the
 * public link, the do-not-contact list and the log redaction.
 */

import { createHash, randomBytes } from 'node:crypto';

/** A token is 32 random bytes in base64url: 43 characters, nothing else. */
export const UNSUBSCRIBE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** The site path the link in every mail points at; the site hands it to the backend. */
export const PUBLIC_UNSUBSCRIBE_PATH = '/api/email/unsubscribe';

/** Seed id stored on a suppression that covers every agent. */
export const EVERY_AGENT = '*';

export function newUnsubscribeToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashUnsubscribeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Trimmed, lower case, without surrounding angle brackets. */
export function canonicalAddress(address: string): string {
  return address.trim().replace(/^<+|>+$/g, '').trim().toLowerCase();
}

/**
 * The key suppressions and tokens are stored under, so the tables never hold
 * a recipient's address in the clear.
 */
export function addressKey(address: string): string {
  return createHash('sha256').update(`wunderland-mail:${canonicalAddress(address)}`).digest('hex');
}

/** "reader.person@example.com" -> "r***@example.com". */
export function maskAddress(address: string): string {
  const canonical = canonicalAddress(address);
  const at = canonical.lastIndexOf('@');
  if (at <= 0) return '***';
  return `${canonical[0]}***${canonical.slice(at)}`;
}

/**
 * Addresses that must never receive mail, from MAIL_DO_NOT_CONTACT
 * (comma, semicolon or whitespace separated), read at every send.
 */
export function doNotContactKeys(raw = process.env.MAIL_DO_NOT_CONTACT ?? ''): Set<string> {
  return new Set(
    raw
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter((value) => value.includes('@'))
      .map((value) => addressKey(value))
  );
}

export class MailLinkConfigError extends Error {}

/**
 * The site address the unsubscribe link is built on (FRONTEND_URL). In
 * production it must be a plain https origin, optionally with a path, so a
 * mailbox provider can POST to the link.
 */
export function siteBaseUrl(): string {
  const raw = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new MailLinkConfigError(
      'FRONTEND_URL is not a valid address, so mail cannot carry its https unsubscribe link.'
    );
  }
  const production = process.env.NODE_ENV === 'production';
  const plain = !url.search && !url.hash && !url.username && !url.password && !raw.includes('#');
  if ((production && url.protocol !== 'https:') || !plain || !/^https?:$/.test(url.protocol)) {
    throw new MailLinkConfigError(
      'FRONTEND_URL must be the site\'s plain https address, so every mail can carry its https unsubscribe link.'
    );
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

export function unsubscribeLink(token: string, site: string = siteBaseUrl()): string {
  return `${site}${PUBLIC_UNSUBSCRIBE_PATH}/${token}`;
}

/** Replaces the token in a logged request path with [token]. */
export function redactMailTokens(url: string): string {
  return url.replace(/(\/email\/unsubscribe\/)[^/?#\s]+/g, '$1[token]');
}
