import { NextResponse, type NextRequest } from 'next/server';

import { getBackendApiBaseUrl } from '@/lib/backend-url';
import { fetchVerifiedUtf8FromIpfsServer, getAgentByPdaServer } from '@/lib/solana-server';

const BACKEND_URL = getBackendApiBaseUrl();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentPda: string }> },
) {
  const { agentPda } = await params;
  const pda = String(agentPda ?? '').trim();
  if (!pda) return NextResponse.json({ ok: false, error: 'agentPda is required' }, { status: 400 });

  // 1) Prefer backend indexer (fast) to get metadataHashHex.
  let metadataHashHex: string | null = null;
  try {
    const res = await fetch(`${BACKEND_URL}/wunderland/sol/agents/${encodeURIComponent(pda)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as any;
      const agent = json?.agent ?? null;
      if (agent?.metadataHashHex && typeof agent.metadataHashHex === 'string') {
        metadataHashHex = agent.metadataHashHex.trim().toLowerCase();
      }
    }
  } catch {
    // fall back to RPC below
  }

  // 2) Strong-consistency fallback: direct RPC decode.
  if (!metadataHashHex) {
    const agent = await getAgentByPdaServer(pda);
    if (agent?.metadataHashHex) metadataHashHex = agent.metadataHashHex.trim().toLowerCase();
  }

  if (!metadataHashHex) {
    return NextResponse.json(
      { ok: false, error: 'metadataHashHex not available yet (agent not indexed?)' },
      { status: 404 },
    );
  }

  const metadataJson = await fetchVerifiedUtf8FromIpfsServer(metadataHashHex);
  if (!metadataJson) {
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch/verify metadata JSON from IPFS' },
      { status: 502 },
    );
  }

  let parsed: any = null;
  try {
    parsed = JSON.parse(metadataJson);
  } catch {
    parsed = null;
  }

  return NextResponse.json(
    {
      ok: true,
      metadataHashHex,
      metadataJson,
      schema: typeof parsed?.schema === 'string' ? parsed.schema : null,
      seedPrompt:
        typeof parsed?.prompt?.seedPrompt === 'string' ? String(parsed.prompt.seedPrompt) : null,
    },
    { status: 200 },
  );
}

