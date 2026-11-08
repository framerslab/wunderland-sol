/**
 * @file unsubscribe-token.ts
 * @description The pieces every agent mail's unsubscribe link is made of:
 * the opaque token, the keyed address, the masked hint the page shows, the
 * public link, the do-not-contact list and the log redaction.
 */

import { createHash, createHmac, randomBytes } from 'node:crypto';

/** A token is 32 random bytes in base64url: 43 characters, nothing else. */
export const UNSUBSCRIBE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** The site path the link in every mail points at; the site hands it to the backend. */
export const PUBLIC_UNSUBSCRIBE_PATH = '/api/email/unsubscribe';

/** A new token for one mail. */
export function newUnsubscribeToken(): string {
  return randomBytes(32).toString('base64url');
}

/** The SHA-256 a token is stored and looked up under. */
export function hashUnsubscribeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Trimmed, lower case, without surrounding angle brackets. */
export function canonicalAddress(address: string): string {
  return address.trim().replace(/^<+|>+$/g, '').trim().toLowerCase();
}

export class MailLinkConfigError extends Error {}

/**
 * The server secret recipient addresses are keyed with: the Credential
 * Vault's key (WUNDERLAND_CREDENTIALS_ENCRYPTION_KEY, or JWT_SECRET when it
 * is unset). Production refuses to send mail without one; elsewhere a fixed
 * development key is used.
 */
function addressSecret(): Buffer {
  const material =
    process.env.WUNDERLAND_CREDENTIALS_ENCRYPTION_KEY?.trim() || process.env.JWT_SECRET?.trim();
  if (!material) {
    if (process.env.NODE_ENV === 'production') {
      throw new MailLinkConfigError(
        'Set WUNDERLAND_CREDENTIALS_ENCRYPTION_KEY (or JWT_SECRET) before agents send mail: unsubscribes are stored under it.'
      );
    }
    return createHash('sha256').update('wunderland-mail-address:development').digest();
  }
  return createHash('sha256').update(`wunderland-mail-address:${material}`).digest();
}

/**
 * The key suppressions and tokens are stored under (HMAC-SHA256 with the
 * server secret), so the tables never hold a recipient's address, and a copy
 * of the database alone cannot confirm a guessed one.
 */
export function addressKey(address: string): string {
  return createHmac('sha256', addressSecret()).update(canonicalAddress(address)).digest('hex');
}

/** A value that changes whenever the server secret does. */
export function addressKeyCheck(): string {
  return createHmac('sha256', addressSecret()).update('wunderland-mail-key-check').digest('hex');
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

/**
 * The site address the unsubscribe link is built on (FRONTEND_URL). It must
 * be the site's bare origin (https in production), since the site serves the
 * unsubscribe route at its root and a mailbox provider POSTs to the link.
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
  const bare =
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password &&
    !/[?#]/.test(raw);
  if ((production && url.protocol !== 'https:') || !bare || !/^https?:$/.test(url.protocol)) {
    throw new MailLinkConfigError(
      'FRONTEND_URL must be the site\'s bare https origin (no path, query or fragment), so every mail can carry its https unsubscribe link.'
    );
  }
  return url.origin;
}

/** The link a mail carries in its footer and List-Unsubscribe header. */
export function unsubscribeLink(token: string, site: string = siteBaseUrl()): string {
  return `${site}${PUBLIC_UNSUBSCRIBE_PATH}/${token}`;
}

/** Replaces the token in a logged request path with [token]. */
export function redactMailTokens(url: string): string {
  return url.replace(/(\/email\/unsubscribe\/)[^/?#\s]+/gi, '$1[token]');
}
