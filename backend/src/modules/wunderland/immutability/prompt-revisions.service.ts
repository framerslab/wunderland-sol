/**
 * @file prompt-revisions.service.ts
 * @description Agent-only, Ed25519-signed prompt revision ledger (append-only).
 *
 * Design:
 * - Payload is canonical JSON (deep key-sorted) and hashed: `payload_hash = sha256(canonical_payload_json)`.
 * - Each revision links to the previous via `prev_hash` (the previous `payload_hash`).
 * - Signature is Ed25519 over a deterministic message:
 *   `WUNDERLAND_PROMPT_REVISION_V1\nseed:<seedId>\nprev:<prevHash>\npayload:<payloadHash>`
 *
 * The signer must match the agent's on-chain `agent_signer` (resolved via the indexed cache or managed custody row).
 */

import { Injectable } from '@nestjs/common';
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
} from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import { DatabaseService } from '../../../database/database.service.js';
import { decryptSecret } from '../../../utils/crypto.js';

const PROMPT_REVISION_DOMAIN = 'WUNDERLAND_PROMPT_REVISION_V1';
const MAX_PAYLOAD_BYTES = 64_000;

function sha256HexUtf8(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function stableSortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSortJson);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      out[key] = stableSortJson(record[key]);
    }
    return out;
  }
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function canonicalizeJsonString(raw: string): { canonical: string; parsed: unknown } | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const canonical = JSON.stringify(stableSortJson(parsed));
    return { canonical, parsed };
  } catch {
    return null;
  }
}

function solanaPublicKeyToSpkiDer(pubkeyBytes: Uint8Array): Buffer {
  return Buffer.concat([
    Buffer.from('302a300506032b6570032100', 'hex'),
    Buffer.from(pubkeyBytes),
  ]);
}

function solanaPrivateSeedToPkcs8Der(seed32: Uint8Array): Buffer {
  if (seed32.length !== 32) throw new Error('Expected 32-byte Ed25519 private seed.');
  // PKCS8 header for Ed25519 private key (RFC 8410)
  return Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seed32)]);
}

function buildPromptRevisionMessage(opts: {
  seedId: string;
  prevHash: string | null;
  payloadHash: string;
}): Buffer {
  const prev = opts.prevHash ? opts.prevHash.toLowerCase() : '';
  const payload = opts.payloadHash.toLowerCase();
  const msg = `${PROMPT_REVISION_DOMAIN}\nseed:${opts.seedId}\nprev:${prev}\npayload:${payload}`;
  return Buffer.from(msg, 'utf8');
}

function verifyEd25519SignatureBase64(opts: {
  signerPubkey: string;
  message: Buffer;
  signatureB64: string;
}): boolean {
  const signerKey = new PublicKey(opts.signerPubkey);
  const keyDer = solanaPublicKeyToSpkiDer(signerKey.toBytes());
  const keyObject = createPublicKey({ key: keyDer, format: 'der', type: 'spki' });
  const signature = Buffer.from(opts.signatureB64, 'base64');
  return cryptoVerify(null, opts.message, keyObject, signature);
}

function signEd25519Base64(opts: { privateSeed32: Uint8Array; message: Buffer }): string {
  const keyDer = solanaPrivateSeedToPkcs8Der(opts.privateSeed32);
  const keyObject = createPrivateKey({ key: keyDer, format: 'der', type: 'pkcs8' });
  const signature = cryptoSign(null, opts.message, keyObject);
  return signature.toString('base64');
}

type PromptRevisionRow = {
  revision_id: string;
  seed_id: string;
  created_at: number;
  signer_pubkey: string;
  prev_hash: string | null;
  payload_json: string;
  payload_hash: string;
  signature_b64: string;
  source: string;
};

export type PromptRevisionApi = {
  revisionId: string;
  seedId: string;
  createdAt: string;
  signerPubkey: string;
  prevHash: string | null;
  payloadJson: string;
  payloadHash: string;
  signatureB64: string;
  source: string;
};

export type PromptRevisionChainVerification = {
  ok: boolean;
  total: number;
  headHash: string | null;
  error?: string;
};

@Injectable()
export class PromptRevisionsService {
  constructor(private readonly db: DatabaseService) {}

  async listPromptRevisions(
    seedIdRaw: string,
    opts?: { limit?: number }
  ): Promise<{ revisions: PromptRevisionApi[]; verification: PromptRevisionChainVerification }> {
    const seedId = String(seedIdRaw ?? '').trim();
    if (!seedId) {
      return {
        revisions: [],
        verification: { ok: false, total: 0, headHash: null, error: 'Missing seedId' },
      };
    }

    const limit = Math.max(1, Math.min(200, Number(opts?.limit ?? 50) || 50));
    const rows = await this.db.all<PromptRevisionRow>(
      `SELECT revision_id, seed_id, created_at, signer_pubkey, prev_hash, payload_json, payload_hash, signature_b64, source
         FROM wunderbot_prompt_revisions
        WHERE seed_id = ?
        ORDER BY created_at DESC
        LIMIT ?`,
      [seedId, limit]
    );

    const revisions = rows.map((r) => ({
      revisionId: String(r.revision_id),
      seedId: String(r.seed_id),
      createdAt: new Date(Number(r.created_at ?? 0)).toISOString(),
      signerPubkey: String(r.signer_pubkey),
      prevHash: r.prev_hash ? String(r.prev_hash) : null,
      payloadJson: String(r.payload_json),
      payloadHash: String(r.payload_hash),
      signatureB64: String(r.signature_b64),
      source: String(r.source ?? 'managed'),
    }));

    const verification = await this.verifyPromptRevisionChain(seedId);
    return { revisions, verification };
  }

  async verifyPromptRevisionChain(seedIdRaw: string): Promise<PromptRevisionChainVerification> {
    const seedId = String(seedIdRaw ?? '').trim();
    if (!seedId) return { ok: false, total: 0, headHash: null, error: 'Missing seedId' };

    const rows = await this.db.all<PromptRevisionRow>(
      `SELECT revision_id, seed_id, created_at, signer_pubkey, prev_hash, payload_json, payload_hash, signature_b64, source
         FROM wunderbot_prompt_revisions
        WHERE seed_id = ?
        ORDER BY created_at ASC, revision_id ASC`,
      [seedId]
    );

    let prevHash: string | null = null;
    for (const row of rows) {
      const payloadJson = String(row.payload_json ?? '');
      const payloadHashStored = String(row.payload_hash ?? '').toLowerCase();
      const payloadHashComputed = sha256HexUtf8(payloadJson).toLowerCase();
      if (!payloadHashStored || payloadHashStored !== payloadHashComputed) {
        return {
          ok: false,
          total: rows.length,
          headHash: rows.length > 0 ? String(rows[rows.length - 1]?.payload_hash ?? null) : null,
          error: `payload_hash mismatch at revision ${row.revision_id}`,
        };
      }

      const rowPrev = row.prev_hash ? String(row.prev_hash).toLowerCase() : null;
      const expectedPrev = prevHash ? prevHash.toLowerCase() : null;
      if ((rowPrev ?? null) !== (expectedPrev ?? null)) {
        return {
          ok: false,
          total: rows.length,
          headHash: rows.length > 0 ? String(rows[rows.length - 1]?.payload_hash ?? null) : null,
          error: `prev_hash mismatch at revision ${row.revision_id}`,
        };
      }

      const message = buildPromptRevisionMessage({
        seedId,
        prevHash: expectedPrev,
        payloadHash: payloadHashStored,
      });

      const signatureOk = (() => {
        try {
          return verifyEd25519SignatureBase64({
            signerPubkey: String(row.signer_pubkey),
            message,
            signatureB64: String(row.signature_b64 ?? ''),
          });
        } catch {
          return false;
        }
      })();

      if (!signatureOk) {
        return {
          ok: false,
          total: rows.length,
          headHash: rows.length > 0 ? String(rows[rows.length - 1]?.payload_hash ?? null) : null,
          error: `invalid signature at revision ${row.revision_id}`,
        };
      }

      prevHash = payloadHashStored;
    }

    const headHash = rows.length > 0 ? String(rows[rows.length - 1]?.payload_hash ?? null) : null;
    return { ok: true, total: rows.length, headHash };
  }

  async appendPromptRevisionSigned(opts: {
    seedId: string;
    payloadJson: string;
    signatureB64: string;
    prevHash: string | null;
    source?: string;
  }): Promise<{ ok: boolean; inserted: boolean; payloadHash?: string; error?: string }> {
    const seedId = String(opts.seedId ?? '').trim();
    if (!seedId) return { ok: false, inserted: false, error: 'Missing seedId' };

    const signatureB64 = typeof opts.signatureB64 === 'string' ? opts.signatureB64.trim() : '';
    if (!signatureB64) return { ok: false, inserted: false, error: 'Missing signatureB64' };

    const parsed = canonicalizeJsonString(String(opts.payloadJson ?? ''));
    if (!parsed) return { ok: false, inserted: false, error: 'payloadJson must be valid JSON' };
    if (Buffer.byteLength(parsed.canonical, 'utf8') > MAX_PAYLOAD_BYTES) {
      return {
        ok: false,
        inserted: false,
        error: `payloadJson too large (max ${MAX_PAYLOAD_BYTES} bytes)`,
      };
    }

    const payloadHash = sha256HexUtf8(parsed.canonical).toLowerCase();
    const requestPrevHash =
      typeof opts.prevHash === 'string' && opts.prevHash.trim()
        ? opts.prevHash.trim().toLowerCase()
        : null;

    const expectedSigner = await this.resolveAgentSignerPubkey(seedId);
    if (!expectedSigner) return { ok: false, inserted: false, error: 'Unknown agent signer pubkey for this seedId' };

    const revisionId = this.db.generateId();
    const createdAt = Date.now();
    const source = typeof opts.source === 'string' && opts.source.trim() ? opts.source.trim() : 'agent';

    try {
      let inserted = false;
      await this.db.transaction(async (trx) => {
        const latest = await trx.get<{ payload_hash: string | null }>(
          `SELECT payload_hash
             FROM wunderbot_prompt_revisions
            WHERE seed_id = ?
            ORDER BY created_at DESC
            LIMIT 1`,
          [seedId]
        );
        const expectedPrev = latest?.payload_hash ? String(latest.payload_hash).toLowerCase() : null;

        if ((expectedPrev ?? null) !== (requestPrevHash ?? null)) {
          throw new Error('prevHash mismatch');
        }

        if (expectedPrev && expectedPrev === payloadHash) {
          // No-op: same payload as the current head.
          return;
        }

        const message = buildPromptRevisionMessage({ seedId, prevHash: expectedPrev, payloadHash });

        let signatureOk = false;
        try {
          signatureOk = verifyEd25519SignatureBase64({
            signerPubkey: expectedSigner,
            message,
            signatureB64,
          });
        } catch {
          signatureOk = false;
        }
        if (!signatureOk) throw new Error('Invalid signature');

        await trx.run(
          `INSERT INTO wunderbot_prompt_revisions (
            revision_id, seed_id, created_at, signer_pubkey, prev_hash, payload_json, payload_hash, signature_b64, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            revisionId,
            seedId,
            createdAt,
            expectedSigner,
            expectedPrev,
            parsed.canonical,
            payloadHash,
            signatureB64,
            source,
          ]
        );
        inserted = true;
      });

      return { ok: true, inserted, payloadHash };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, inserted: false, error: msg };
    }
  }

  async appendPromptRevisionManaged(seedIdRaw: string, payload: unknown): Promise<void> {
    const seedId = String(seedIdRaw ?? '').trim();
    if (!seedId) return;

    const canonicalPayload = JSON.stringify(stableSortJson(payload));
    if (Buffer.byteLength(canonicalPayload, 'utf8') > MAX_PAYLOAD_BYTES) return;

    const payloadHash = sha256HexUtf8(canonicalPayload).toLowerCase();

    await this.db.transaction(async (trx) => {
      const latest = await trx.get<{ payload_hash: string | null }>(
        `SELECT payload_hash
           FROM wunderbot_prompt_revisions
          WHERE seed_id = ?
          ORDER BY created_at DESC
          LIMIT 1`,
        [seedId]
      );
      const prevHash = latest?.payload_hash ? String(latest.payload_hash).toLowerCase() : null;
      if (prevHash && prevHash === payloadHash) return;

      const managed = await trx.get<{
        agent_signer_pubkey: string;
        encrypted_signer_secret_key: string;
      }>(
        `SELECT agent_signer_pubkey, encrypted_signer_secret_key
           FROM wunderland_sol_agent_signers
          WHERE seed_id = ?
          LIMIT 1`,
        [seedId]
      );
      if (!managed?.agent_signer_pubkey || !managed.encrypted_signer_secret_key) return;

      const decrypted =
        decryptSecret(String(managed.encrypted_signer_secret_key)) ??
        String(managed.encrypted_signer_secret_key);
      const secretKeyJson = this.parseSecretKeyJson(decrypted);
      if (!secretKeyJson) return;

      const privateSeed32 = Uint8Array.from(secretKeyJson.slice(0, 32));
      const message = buildPromptRevisionMessage({ seedId, prevHash, payloadHash });
      const signatureB64 = signEd25519Base64({ privateSeed32, message });

      // Sanity check.
      if (
        !verifyEd25519SignatureBase64({
          signerPubkey: String(managed.agent_signer_pubkey),
          message,
          signatureB64,
        })
      ) {
        return;
      }

      const revisionId = this.db.generateId();
      const createdAt = Date.now();
      await trx.run(
        `INSERT INTO wunderbot_prompt_revisions (
          revision_id, seed_id, created_at, signer_pubkey, prev_hash, payload_json, payload_hash, signature_b64, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          revisionId,
          seedId,
          createdAt,
          String(managed.agent_signer_pubkey),
          prevHash,
          canonicalPayload,
          payloadHash,
          signatureB64,
          'managed',
        ]
      );
    });
  }

  private parseSecretKeyJson(raw: string): number[] | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed) || parsed.length !== 64) return null;
      const bytes = parsed.map((n) => (Number(n) ?? 0) & 0xff);
      if (bytes.length !== 64) return null;
      return bytes;
    } catch {
      return null;
    }
  }

  private async getLatestPayloadHash(seedId: string): Promise<string | null> {
    const latest = await this.db.get<{ payload_hash: string | null }>(
      `SELECT payload_hash
         FROM wunderbot_prompt_revisions
        WHERE seed_id = ?
        ORDER BY created_at DESC
        LIMIT 1`,
      [seedId]
    );
    return latest?.payload_hash ? String(latest.payload_hash).toLowerCase() : null;
  }

  private async resolveAgentSignerPubkey(seedId: string): Promise<string | null> {
    // 1) Managed custody row (authoritative if present).
    const managed = await this.db.get<{ agent_signer_pubkey: string }>(
      `SELECT agent_signer_pubkey
         FROM wunderland_sol_agent_signers
        WHERE seed_id = ?
        LIMIT 1`,
      [seedId]
    );
    const managedKey = managed?.agent_signer_pubkey ? String(managed.agent_signer_pubkey).trim() : '';
    if (managedKey) return managedKey;

    // 2) Indexed on-chain cache.
    const cached = await this.db.get<{ agent_signer_pubkey: string | null }>(
      `SELECT agent_signer_pubkey
         FROM wunderland_sol_agents
        WHERE agent_pda = ?
        LIMIT 1`,
      [seedId]
    );
    const cachedKey = cached?.agent_signer_pubkey ? String(cached.agent_signer_pubkey).trim() : '';
    if (cachedKey) return cachedKey;

    // 3) AgentOS provenance public key (non-Solana agents).
    const prov = await this.db.get<{ public_key: string | null }>(
      `SELECT public_key
         FROM wunderbots
        WHERE seed_id = ?
        LIMIT 1`,
      [seedId]
    );
    const provKey = prov?.public_key ? String(prov.public_key).trim() : '';
    if (provKey) return provKey;

    return null;
  }
}
