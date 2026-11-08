import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * The unsubscribe link in every agent mail points at the site
 * (/api/email/unsubscribe/<token>); the site hands the request to the
 * backend, which owns the page and the suppression. A local HTTP server
 * stands in for the backend here.
 */

type Seen = { method: string; url: string; contentType: string; body: string };

const TOKEN = 'Tk_' + 'a'.repeat(40);
const UNKNOWN = 'Z'.repeat(43);
const JSON_ERROR = 'J'.repeat(43);
const REFLECTED = '<p/onclick=alert(1)>';

let server: http.Server;
let seen: Seen[] = [];
let savedBackend: string | undefined;

beforeAll(async () => {
  savedBackend = process.env.WUNDERLAND_BACKEND_URL;
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      seen.push({
        method: req.method ?? '',
        url: req.url ?? '',
        contentType: String(req.headers['content-type'] ?? ''),
        body,
      });
      if ((req.url ?? '').endsWith(`/${JSON_ERROR}`)) {
        // A JSON error that repeats what the request sent, as a body parser's error does.
        res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ statusCode: 400, message: `Unexpected token in JSON at ${REFLECTED}` }));
        return;
      }
      const status = (req.url ?? '').endsWith(`/${UNKNOWN}`) ? 404 : 200;
      res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
      res.end(status === 200 ? '<form method="post">Unsubscribe</form>' : '<p>This link is not valid.</p>');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as AddressInfo;
  process.env.WUNDERLAND_BACKEND_URL = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (savedBackend === undefined) delete process.env.WUNDERLAND_BACKEND_URL;
  else process.env.WUNDERLAND_BACKEND_URL = savedBackend;
});

beforeEach(() => {
  seen = [];
});

function ctx(token: string) {
  return { params: Promise.resolve({ token }) };
}

describe('GET and POST /api/email/unsubscribe/[token]', () => {
  it('GET returns the backend page and only asks', async () => {
    const { GET } = await import('@/app/api/email/unsubscribe/[token]/route');
    const res = await GET(new Request(`https://wunderland.test/api/email/unsubscribe/${TOKEN}`), ctx(TOKEN));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
    expect(res.headers.get('x-robots-tag')).toMatch(/noindex/);
    expect(await res.text()).toContain('<form method="post">');
    expect(seen).toEqual([
      { method: 'GET', url: `/api/wunderland/email/unsubscribe/${TOKEN}`, contentType: '', body: '' },
    ]);
  });

  it('POST passes the one-click body to the backend', async () => {
    const { POST } = await import('@/app/api/email/unsubscribe/[token]/route');
    const res = await POST(
      new Request(`https://wunderland.test/api/email/unsubscribe/${TOKEN}`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      }),
      ctx(TOKEN)
    );

    expect(res.status).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url).toBe(`/api/wunderland/email/unsubscribe/${TOKEN}`);
    expect(seen[0].contentType).toMatch(/application\/x-www-form-urlencoded/);
    expect(seen[0].body).toBe('List-Unsubscribe=One-Click');
  });

  it('passes the backend refusal of an unknown token through', async () => {
    const { POST } = await import('@/app/api/email/unsubscribe/[token]/route');
    const res = await POST(
      new Request(`https://wunderland.test/api/email/unsubscribe/${UNKNOWN}`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      }),
      ctx(UNKNOWN)
    );
    expect(res.status).toBe(404);
  });

  it('never serves a non-HTML backend reply as a page', async () => {
    const { POST } = await import('@/app/api/email/unsubscribe/[token]/route');
    const res = await POST(
      new Request(`https://wunderland.test/api/email/unsubscribe/${JSON_ERROR}`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      }),
      ctx(JSON_ERROR)
    );
    const html = await res.text();
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(html).not.toContain(REFLECTED);
    expect(html).not.toContain('Unexpected token');
  });

  it('sends the backend a form body whatever content type arrives', async () => {
    const { POST } = await import('@/app/api/email/unsubscribe/[token]/route');
    const res = await POST(
      new Request(`https://wunderland.test/api/email/unsubscribe/${TOKEN}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{"scope":"all"}',
      }),
      ctx(TOKEN)
    );
    expect(res.status).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].contentType).toMatch(/^application\/x-www-form-urlencoded/);
    expect(seen[0].body).toBe('');
  });

  it('a malformed token never reaches the backend', async () => {
    const { GET } = await import('@/app/api/email/unsubscribe/[token]/route');
    const res = await GET(new Request('https://wunderland.test/api/email/unsubscribe/x'), ctx('../../agents'));
    expect(res.status).toBe(404);
    expect(seen).toHaveLength(0);
  });
});
