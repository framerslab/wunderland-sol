/**
 * @file prompt-evolution-persistence.service.ts
 * @description Persistence adapter for PromptEvolution state.
 *
 * For Solana-managed agents, this persists state as an **append-only, Ed25519-signed**
 * revision chain (see `wunderbot_prompt_revisions`) so humans cannot edit prompt
 * evolution history without detection. For other agents, falls back to legacy
 * `wunderbots.evolved_prompt_adaptations`.
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service.js';
import type { IPromptEvolutionPersistenceAdapter, PromptEvolutionState } from '@wunderland/social';
import { PromptRevisionsService } from '../immutability/prompt-revisions.service.js';

@Injectable()
export class PromptEvolutionPersistenceService implements IPromptEvolutionPersistenceAdapter {
  constructor(
    private readonly db: DatabaseService,
    private readonly promptRevisions: PromptRevisionsService,
  ) {}

  async savePromptEvolutionState(seedId: string, state: PromptEvolutionState): Promise<void> {
    const normalized = String(seedId ?? '').trim();
    if (!normalized) return;

    // Preferred path: managed Solana agent signer exists → append signed revision.
    try {
      const signer = await this.db.get<{ seed_id: string }>(
        `SELECT seed_id FROM wunderland_sol_agent_signers WHERE seed_id = ? LIMIT 1`,
        [normalized],
      );
      if (signer?.seed_id) {
        await this.promptRevisions.appendPromptRevisionManaged(normalized, state);
        return;
      }
    } catch {
      // Fall through to legacy persistence.
    }

    // Legacy fallback (mutable blob).
    await this.db.run(`UPDATE wunderbots SET evolved_prompt_adaptations = ? WHERE seed_id = ?`, [
      JSON.stringify(state),
      normalized,
    ]);
  }

  async loadPromptEvolutionState(seedId: string): Promise<PromptEvolutionState | null> {
    const normalized = String(seedId ?? '').trim();
    if (!normalized) return null;

    // 1) Signed revision ledger (source of truth when present).
    const latest = await this.db.get<{ payload_json: string }>(
      `SELECT payload_json
         FROM wunderbot_prompt_revisions
        WHERE seed_id = ?
        ORDER BY created_at DESC
        LIMIT 1`,
      [normalized],
    );
    if (latest?.payload_json) {
      try {
        return JSON.parse(String(latest.payload_json)) as PromptEvolutionState;
      } catch {
        // fall through
      }
    }

    // 2) Legacy blob.
    const row = await this.db.get<{ evolved_prompt_adaptations: string | null }>(
      `SELECT evolved_prompt_adaptations FROM wunderbots WHERE seed_id = ?`,
      [normalized],
    );
    if (!row?.evolved_prompt_adaptations) return null;

    try {
      const parsed = JSON.parse(row.evolved_prompt_adaptations) as PromptEvolutionState;

      // Opportunistic one-way migration when managed signer exists and no revisions exist yet.
      try {
        const signer = await this.db.get<{ seed_id: string }>(
          `SELECT seed_id FROM wunderland_sol_agent_signers WHERE seed_id = ? LIMIT 1`,
          [normalized],
        );
        if (signer?.seed_id) {
          await this.promptRevisions.appendPromptRevisionManaged(normalized, parsed);
        }
      } catch {
        // ignore
      }

      return parsed;
    } catch {
      return null;
    }
  }
}
