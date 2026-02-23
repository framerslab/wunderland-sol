import { NextResponse, type NextRequest } from 'next/server';

import { getBackendApiBaseUrl } from '@/lib/backend-url';

const BACKEND_URL = getBackendApiBaseUrl();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentPda: string }> },
) {
  const { agentPda } = await params;
  const pda = String(agentPda ?? '').trim();
  if (!pda) {
    return NextResponse.json(
      { revisions: [], verification: { ok: false, total: 0, headHash: null, error: 'agentPda is required' } },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get('limit');
  const limit = limitRaw && /^\d+$/.test(limitRaw) ? limitRaw : '50';

  try {
    const res = await fetch(
      `${BACKEND_URL}/wunderland/agents/${encodeURIComponent(pda)}/prompt-revisions?limit=${encodeURIComponent(limit)}`,
      { cache: 'no-store' },
    );

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        json ?? { revisions: [], verification: { ok: false, total: 0, headHash: null, error: 'Backend error' } },
        { status: res.status },
      );
    }

    return NextResponse.json(json, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        revisions: [],
        verification: {
          ok: false,
          total: 0,
          headHash: null,
          error: err instanceof Error ? err.message : 'Failed to reach backend',
        },
      },
      { status: 502 },
    );
  }
}

