/**
 * @file email-unsubscribe.service.ts
 * @description Unsubscribe tokens and suppressions for agent mail.
 *
 * Every agent mail gets its own token. Only the token's SHA-256 is stored,
 * beside the keyed recipient address, a masked hint for the page, the agent
 * and its name. A suppression is either one agent (its seed id) or every
 * agent ('*') for a keyed address. Nothing here sends mail: unsubscribing
 * never sends a confirmation.
 */

import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service.js';
import {
  EVERY_AGENT,
  UNSUBSCRIBE_TOKEN_PATTERN,
  addressKey,
  doNotContactKeys,
  hashUnsubscribeToken,
  maskAddress,
  newUnsubscribeToken,
} from './unsubscribe-token.js';

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

  /** Stores a new token for one mail and returns the raw token for its link. */
  async issueToken(params: { recipient: string; seedId: string; agentName: string }): Promise<string> {
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
        Date.now(),
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
           AND seed_id IN (?, ?)
         LIMIT 1
      `,
      [key, seedId, EVERY_AGENT]
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
         LIMIT 1
      `,
      [hashUnsubscribeToken(token)]
    );
    if (!row) return null;

    const suppressions = await this.db.all<{ seed_id: string }>(
      `
        SELECT seed_id
          FROM wunderland_email_suppressions
         WHERE address_key = ?
           AND seed_id IN (?, ?)
      `,
      [row.address_key, row.seed_id, EVERY_AGENT]
    );
    const seeds = new Set(suppressions.map((s) => String(s.seed_id)));

    return {
      addressKey: String(row.address_key),
      addressHint: String(row.address_hint),
      seedId: String(row.seed_id),
      agentName: String(row.agent_name),
      agentSuppressed: seeds.has(String(row.seed_id)) || seeds.has(EVERY_AGENT),
      allSuppressed: seeds.has(EVERY_AGENT),
    };
  }

  /** Suppresses at once; returns null when the token is unknown. */
  async unsubscribe(token: string, scope: UnsubscribeScope): Promise<UnsubscribeState | null> {
    const state = await this.lookup(token);
    if (!state) return null;
    const seedId = scope === 'all' ? EVERY_AGENT : state.seedId;
    await this.db.run(
      `
        INSERT INTO wunderland_email_suppressions (address_key, seed_id, reason, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (address_key, seed_id) DO NOTHING
      `,
      [state.addressKey, seedId, 'unsubscribe', Date.now()]
    );
    return this.lookup(token);
  }
}
