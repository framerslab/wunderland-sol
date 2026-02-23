import { describe, it, expect, vi } from 'vitest';

import { AgentRegistryService } from './agent-registry.service.js';
import { AgentImmutableException } from '../wunderland.exceptions.js';

describe('AgentRegistryService immutability enforcement', () => {
  it('rejects spec mutations for prompt-immutable AgentSpec v2 agents', async () => {
    const trx = {
      get: vi.fn(async () => ({
        seed_id: 'seed_1',
        owner_user_id: 'user_1',
        display_name: 'Old',
        bio: '',
        avatar_url: null,
        hexaco_traits: JSON.stringify({ honesty_humility: 0.5 }),
        security_profile: JSON.stringify({ storagePolicy: 'sealed' }),
        inference_hierarchy: JSON.stringify({ profile: 'default' }),
        step_up_auth_config: null,
        base_system_prompt: 'Seed prompt',
        prompt_immutable: 1,
        onchain_metadata_hash: 'a'.repeat(64),
        onchain_metadata_schema: 'wunderland.agent-spec.v2',
        allowed_tool_ids: JSON.stringify([]),
        toolset_manifest_json: null,
        toolset_hash: null,
        genesis_event_id: null,
        public_key: null,
        storage_policy: 'sealed',
        sealed_at: null,
        provenance_enabled: 1,
        tool_access_profile: 'social-citizen',
        evolved_prompt_adaptations: null,
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now(),
      })),
      run: vi.fn(async () => ({ changes: 1, lastInsertRowid: 1 })),
    };

    const db = {
      transaction: vi.fn(async (fn: any) => fn(trx)),
    };

    const svc = new AgentRegistryService(db as any);
    await expect(
      svc.updateAgent('user_1', 'seed_1', { displayName: 'New' } as any),
    ).rejects.toBeInstanceOf(AgentImmutableException);
  });

  it('rejects avatarUrl updates after sealing', async () => {
    const trx = {
      get: vi.fn(async () => ({
        seed_id: 'seed_1',
        owner_user_id: 'user_1',
        display_name: 'Old',
        bio: '',
        avatar_url: null,
        hexaco_traits: JSON.stringify({ honesty_humility: 0.5 }),
        security_profile: JSON.stringify({ storagePolicy: 'sealed' }),
        inference_hierarchy: JSON.stringify({ profile: 'default' }),
        step_up_auth_config: null,
        base_system_prompt: 'Seed prompt',
        prompt_immutable: 0,
        onchain_metadata_hash: null,
        onchain_metadata_schema: null,
        allowed_tool_ids: JSON.stringify([]),
        toolset_manifest_json: null,
        toolset_hash: null,
        genesis_event_id: null,
        public_key: null,
        storage_policy: 'sealed',
        sealed_at: Date.now(),
        provenance_enabled: 1,
        tool_access_profile: 'social-citizen',
        evolved_prompt_adaptations: null,
        status: 'active',
        created_at: Date.now(),
        updated_at: Date.now(),
      })),
      run: vi.fn(async () => ({ changes: 1, lastInsertRowid: 1 })),
    };

    const db = {
      transaction: vi.fn(async (fn: any) => fn(trx)),
    };

    const svc = new AgentRegistryService(db as any);
    await expect(
      svc.updateAgent('user_1', 'seed_1', { avatarUrl: 'https://example.com/a.png' } as any),
    ).rejects.toBeInstanceOf(AgentImmutableException);
  });
});

