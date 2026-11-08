import { getBackendApiBaseUrl } from '@/lib/backend-url';

/**
 * The unsubscribe link at the bottom of every agent mail
 * (https://<site>/api/email/unsubscribe/<token>, also in its List-Unsubscribe
 * header). The backend owns the page and the suppression; this route hands
 * the request over. GET only asks; POST (a mailbox provider's one-click POST
 * or the page's buttons) suppresses at once. The backend always gets a form
 * body, and only an HTML reply from it is served as the page.
 */

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** A one-click body is 26 bytes and the page's form adds a scope; nothing larger is read. */
const MAX_FORM_BYTES = 8 * 1024;

type RouteContext = { params: Promise<{ token: string }> };

const PAGE_HEADERS: Record<string, string> = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex',
  'referrer-policy': 'no-referrer',
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

function page(status: number, title: string, text: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Wunderland</title><style>body{margin:0;font:17px/1.5 system-ui,sans-serif;padding:48px 16px;max-width:34rem;margin-inline:auto}@media (prefers-color-scheme:dark){body{background:#0f0f14;color:#f1f1f6}}</style></head><body><h1 style="font-size:24px">${title}</h1><p>${text}</p></body></html>`;
  return new Response(html, { status, headers: PAGE_HEADERS });
}

/** The body as text, or null once it passes `limit` bytes (the rest is never read). */
async function readBounded(req: Request, limit: number): Promise<string | null> {
  const declared = Number(req.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!req.body) return '';
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function forward(req: Request, ctx: RouteContext, method: 'GET' | 'POST'): Promise<Response> {
  const { token } = await ctx.params;
  if (!TOKEN_PATTERN.test(token)) {
    return page(404, 'This link is not valid', 'Open the Unsubscribe link at the bottom of the mail you received.');
  }

  const init: RequestInit = { method, redirect: 'manual' };
  if (method === 'POST') {
    // RFC 8058 posts "List-Unsubscribe=One-Click" as a form; any other body
    // is dropped unread, and an empty form stops mail from that one agent.
    const incoming = req.headers.get('content-type') || '';
    let body = '';
    if (/^application\/x-www-form-urlencoded\b/i.test(incoming)) {
      const form = await readBounded(req, MAX_FORM_BYTES);
      if (form === null) {
        return page(413, 'This request is too large', 'Open the Unsubscribe link at the bottom of the mail you received and use its button.');
      }
      body = form;
    }
    init.headers = { 'content-type': 'application/x-www-form-urlencoded' };
    init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getBackendApiBaseUrl()}/wunderland/email/unsubscribe/${token}`, init);
  } catch {
    return page(503, 'Please try again', 'We could not reach Wunderland just now. Nothing has changed yet.');
  }

  if (!/^text\/html\b/i.test(upstream.headers.get('content-type') || '')) {
    return upstream.status === 404
      ? page(404, 'This link is not valid', 'Open the Unsubscribe link at the bottom of the mail you received.')
      : page(upstream.status >= 500 || upstream.status === 429 ? 503 : 400, 'Please try again', 'We could not finish that just now. Nothing has changed yet.');
  }

  return new Response(await upstream.text(), { status: upstream.status, headers: PAGE_HEADERS });
}

export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  return forward(req, ctx, 'GET');
}

export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
  return forward(req, ctx, 'POST');
}
