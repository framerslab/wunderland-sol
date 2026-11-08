/**
 * @file email-unsubscribe.service.ts
 * @description Unsubscribe tokens and suppressions for agent mail.
 *
 * Every agent mail gets its own token. Only the token's SHA-256 is stored,
 * beside the keyed recipient address, a masked hint for the page, the agent
 * and its name. A suppression covers one agent (scope 'agent', its seed id)
 * or every agent (scope 'all') for a keyed address. Nothing here sends mail:
 * unsubscribing never sends a confirmation.
 */

import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service.js';
import {
  MailLinkConfigError,
  UNSUBSCRIBE_TOKEN_PATTERN,
  addressKey,
  addressKeyCheck,
  doNotContactKeys,
  hashUnsubscribeToken,
  maskAddress,
  newUnsubscribeToken,
} from './unsubscribe-token.js';

const KEY_CHECK_SETTING = 'address_key_check';

const KEY_CHANGED_MESSAGE =
  'The server key that unsubscribes are stored under has changed (WUNDERLAND_CREDENTIALS_ENCRYPTION_KEY, or JWT_SECRET when it is unset). Restore it; no agent mail is sent until it matches.';

/**
 * How long a mail's unsubscribe link works: two years, well past the 30 days
 * CAN-SPAM asks for (15 U.S.C. 7704(a)(3)(A)(ii)).
 */
export const UNSUBSCRIBE_LINK_LIFETIME_MS = 730 * 24 * 60 * 60 * 1000;

export type UnsubscribeScope = 'agent' | 'all';

export type UnsubscribeTokenRecord = {
  addressKey: string;
  addressHint: string;
  seedId: string;
  agentName: string;
};

export type UnsubscribeState = UnsubscribeTokenRecord & {
  agentSuppressed: boolean;
  allSuppressed: boolean;
};

@Injectable()
export class EmailUnsubscribeService {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  /**
   * Refuses to go on when the address key differs from the one the stored
   * tokens and unsubscribes were made under: every stored unsubscribe would
   * otherwise stop matching without a sound. Stores nothing, so a send
   * refused before any link exists ties no key.
   */
  async assertAddressKeyUnchanged(): Promise<void> {
    const current = addressKeyCheck();
    const row = await this.db.get<{ value: string }>(
      'SELECT value FROM wunderland_email_settings WHERE name = ? LIMIT 1',
      [KEY_CHECK_SETTING]
    );
    if (row && String(row.value) !== current) {
      throw new MailLinkConfigError(KEY_CHANGED_MESSAGE);
    }
  }

  /**
   * Records the address key the first token is made under, then checks it
   * again, so two servers starting with different keys cannot both issue.
   */
  private async bindAddressKey(): Promise<void> {
    await this.db.run(
      `
        INSERT INTO wunderland_email_settings (name, value)
        VALUES (?, ?)
        ON CONFLICT (name) DO NOTHING
      `,
      [KEY_CHECK_SETTING, addressKeyCheck()]
    );
    await this.assertAddressKeyUnchanged();
  }

  /**
   * Stores a new token for one mail and returns the raw token for its link.
   * Tokens older than the link lifetime are dropped first; the unsubscribes
   * they made stay.
   */
  async issueToken(params: { recipient: string; seedId: string; agentName: string }): Promise<string> {
    await this.bindAddressKey();
    const now = Date.now();
    await this.db.run('DELETE FROM wunderland_email_unsubscribe_tokens WHERE created_at < ?', [
      now - UNSUBSCRIBE_LINK_LIFETIME_MS,
    ]);
    const token = newUnsubscribeToken();
    await this.db.run(
      `
        INSERT INTO wunderland_email_unsubscribe_tokens
          (token_hash, address_key, address_hint, seed_id, agent_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        hashUnsubscribeToken(token),
        addressKey(params.recipient),
        maskAddress(params.recipient),
        params.seedId,
        params.agentName,
        now,
      ]
    );
    return token;
  }

  /**
   * True when the address must not receive this agent's mail: it is on the
   * do-not-contact list, or it unsubscribed from this agent or from every
   * agent.
   */
  async isSuppressed(recipient: string, seedId: string): Promise<boolean> {
    const key = addressKey(recipient);
    if (doNotContactKeys().has(key)) return true;
    const row = await this.db.get<{ address_key: string }>(
      `
        SELECT address_key
          FROM wunderland_email_suppressions
         WHERE address_key = ?
           AND (scope = 'all' OR (scope = 'agent' AND seed_id = ?))
         LIMIT 1
      `,
      [key, seedId]
    );
    return Boolean(row);
  }

  /** Reads what a token stands for; null when the token is unknown or malformed. */
  async lookup(token: string): Promise<UnsubscribeState | null> {
    if (!UNSUBSCRIBE_TOKEN_PATTERN.test(token)) return null;
    const row = await this.db.get<{
      address_key: string;
      address_hint: string;
      seed_id: string;
      agent_name: string;
    }>(
      `
        SELECT address_key, address_hint, seed_id, agent_name
          FROM wunderland_email_unsubscribe_tokens
         WHERE token_hash = ?
           AND created_at >= ?
         LIMIT 1
      `,
      [hashUnsubscribeToken(token), Date.now() - UNSUBSCRIBE_LINK_LIFETIME_MS]
    );
    if (!row) return null;

    const suppressions = await this.db.all<{ scope: string }>(
      `
        SELECT scope
          FROM wunderland_email_suppressions
         WHERE address_key = ?
           AND (scope = 'all' OR (scope = 'agent' AND seed_id = ?))
      `,
      [row.address_key, row.seed_id]
    );
    const allSuppressed = suppressions.some((s) => String(s.scope) === 'all');
    const agentSuppressed = allSuppressed || suppressions.some((s) => String(s.scope) === 'agent');

    return {
      addressKey: String(row.address_key),
      addressHint: String(row.address_hint),
      seedId: String(row.seed_id),
      agentName: String(row.agent_name),
      agentSuppressed,
      allSuppressed,
    };
  }

  /** Suppresses at once; returns null when the token is unknown. */
  async unsubscribe(token: string, scope: UnsubscribeScope): Promise<UnsubscribeState | null> {
    const state = await this.lookup(token);
    if (!state) return null;
    await this.db.run(
      `
        INSERT INTO wunderland_email_suppressions (address_key, scope, seed_id, reason, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (address_key, scope, seed_id) DO NOTHING
      `,
      [state.addressKey, scope, scope === 'all' ? '' : state.seedId, 'unsubscribe', Date.now()]
    );
    return this.lookup(token);
  }
}
