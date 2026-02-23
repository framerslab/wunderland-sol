import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import nacl from 'tweetnacl';
import { Keypair } from '@solana/web3.js';

import { PromptRevisionsService } from './prompt-revisions.service.js';

function sha256HexUtf8(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function stableSortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSortJson);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) out[key] = stableSortJson(record[key]);
    return out;
  }
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function canonicalize(raw: string): string {
  const parsed = JSON.parse(raw) as unknown;
  return JSON.stringify(stableSortJson(parsed));
}

function buildRevisionMessage(opts: { seedId: string; prevHash: string | null; payloadHash: string }): Buffer {
  const prev = opts.prevHash ? opts.prevHash.toLowerCase() : '';
  const payload = opts.payloadHash.toLowerCase();
  const msg = `WUNDERLAND_PROMPT_REVISION_V1\nseed:${opts.seedId}\nprev:${prev}\npayload:${payload}`;
  return Buffer.from(msg, 'utf8');
}

describe('PromptRevisionsService', () => {
  it('appends a signed revision and verifies chain', async () => {
    const seedId = Keypair.generate().publicKey.toBase58();
    const signer = Keypair.generate();

    const payloadJsonRaw = JSON.stringify({ b: 1, a: { d: 2, c: 3 } });
    const payloadCanonical = canonicalize(payloadJsonRaw);
    const payloadHash = sha256HexUtf8(payloadCanonical);

    const message = buildRevisionMessage({ seedId, prevHash: null, payloadHash });
    const signatureB64 = Buffer.from(
      nacl.sign.detached(new Uint8Array(message), signer.secretKey)
    ).toString('base64');

    const trx = {
      get: vi.fn(async (sql: string) => {
        if (sql.includes('FROM wunderbot_prompt_revisions')) return undefined;
        return undefined;
      }),
      run: vi.fn(async () => ({ changes: 1, lastInsertRowid: 1 })),
    };

    const db = {
      generateId: vi.fn(() => 'rev_1'),
      get: vi.fn(async (sql: string) => {
        if (sql.includes('FROM wunderland_sol_agent_signers')) return undefined;
        if (sql.includes('FROM wunderland_sol_agents')) return { agent_signer_pubkey: signer.publicKey.toBase58() };
        if (sql.includes('FROM wunderbots')) return undefined;
        return undefined;
      }),
      all: vi.fn(async (sql: string) => {
        if (sql.includes('FROM wunderbot_prompt_revisions')) {
          return [
            {
              revision_id: 'rev_1',
              seed_id: seedId,
              created_at: Date.now(),
              signer_pubkey: signer.publicKey.toBase58(),
              prev_hash: null,
              payload_json: payloadCanonical,
              payload_hash: payloadHash,
              signature_b64: signatureB64,
              source: 'agent',
            },
          ];
        }
        return [];
      }),
      transaction: vi.fn(async (fn: any) => fn(trx)),
    };

    const svc = new PromptRevisionsService(db as any);

    const res = await svc.appendPromptRevisionSigned({
      seedId,
      payloadJson: payloadJsonRaw,
      signatureB64,
      prevHash: null,
      source: 'agent',
    });

    expect(res.ok).toBe(true);
    expect(res.inserted).toBe(true);
    expect(res.payloadHash).toBe(payloadHash.toLowerCase());

    const verification = await svc.verifyPromptRevisionChain(seedId);
    expect(verification.ok).toBe(true);
    expect(verification.total).toBe(1);
  });

  it('rejects invalid signature', async () => {
    const seedId = Keypair.generate().publicKey.toBase58();
    const signer = Keypair.generate();

    const payloadJsonRaw = JSON.stringify({ a: 1 });
    const payloadCanonical = canonicalize(payloadJsonRaw);
    const payloadHash = sha256HexUtf8(payloadCanonical);

    const message = buildRevisionMessage({ seedId, prevHash: null, payloadHash });
    const wrongSigner = Keypair.generate();
    const signatureB64 = Buffer.from(
      nacl.sign.detached(new Uint8Array(message), wrongSigner.secretKey)
    ).toString('base64');

    const trx = {
      get: vi.fn(async () => undefined),
      run: vi.fn(async () => ({ changes: 1, lastInsertRowid: 1 })),
    };

    const db = {
      generateId: vi.fn(() => 'rev_1'),
      get: vi.fn(async (sql: string) => {
        if (sql.includes('FROM wunderland_sol_agent_signers')) return undefined;
        if (sql.includes('FROM wunderland_sol_agents')) return { agent_signer_pubkey: signer.publicKey.toBase58() };
        return undefined;
      }),
      all: vi.fn(async () => []),
      transaction: vi.fn(async (fn: any) => fn(trx)),
    };

    const svc = new PromptRevisionsService(db as any);
    const res = await svc.appendPromptRevisionSigned({
      seedId,
      payloadJson: payloadJsonRaw,
      signatureB64,
      prevHash: null,
      source: 'agent',
    });

    expect(res.ok).toBe(false);
    expect(String(res.error)).toMatch(/invalid signature/i);
    expect(trx.run).not.toHaveBeenCalled();
  });
});

