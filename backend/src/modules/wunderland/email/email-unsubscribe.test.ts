import 'reflect-metadata';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveStorageAdapter } from '@framers/sql-storage-adapter';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import {
  __setAppDatabaseAdapterResolverForTests,
  closeAppDatabase,
  initializeAppDatabase,
} from '../../../core/database/appDatabase.js';
import { DatabaseService } from '../../../database/database.service.js';
import { CredentialsService } from '../credentials/credentials.service.js';
import { EmailIntegrationService } from './email.service.js';
import { buildMessage, type SmtpSendParams } from './smtp-client.js';

/**
 * Every mail an agent sends through its owner's SMTP server goes out through
 * EmailIntegrationService. These tests send each kind (the test mail and an
 * agent's mail) through the service with only the SMTP connection replaced by
 * a capture, render the message the SMTP client writes on DATA, and drive the
 * unsubscribe route over HTTP.
 */

const OWNER = 'mail-owner';
const AGENT_A = 'seed_mail_agent_a';
const AGENT_B = 'seed_mail_agent_b';
const SITE = 'https://wunderland.test';
const RECIPIENT = 'Reader.Person@Example.com';

type Captured = { params: SmtpSendParams; raw: string };

function captureTransport() {
  const sent: Captured[] = [];
  const transport = vi.fn(async (params: SmtpSendParams) => {
    sent.push({ params, raw: buildMessage(params) });
    return { ok: true as const, serverResponse: '250 queued' };
  });
  return { sent, transport };
}

function headerBlock(raw: string): string[] {
  return raw.split('\r\n\r\n')[0].split('\r\n');
}

function headerValues(raw: string, name: string): string[] {
  const prefix = `${name.toLowerCase()}:`;
  return headerBlock(raw)
    .filter((line) => line.toLowerCase().startsWith(prefix))
    .map((line) => line.slice(prefix.length).trim());
}

function bodyOf(raw: string): string {
  return raw.split('\r\n\r\n').slice(1).join('\r\n\r\n');
}

function unsubscribeUrl(raw: string): string {
  const [value] = headerValues(raw, 'List-Unsubscribe');
  const match = /^<([^>]+)>$/.exec(value ?? '');
  if (!match) throw new Error(`no List-Unsubscribe URL in: ${value}`);
  return match[1];
}

function tokenFrom(url: string): string {
  const token = url.split('/').pop() ?? '';
  if (!token) throw new Error(`no token in ${url}`);
  return token;
}

async function insertAgent(db: DatabaseService, seedId: string, name: string): Promise<void> {
  const now = Date.now();
  await db.run(
    `
      INSERT INTO wunderbots (
        seed_id, owner_user_id, display_name, bio, avatar_url, hexaco_traits,
        security_profile, inference_hierarchy, step_up_auth_config, base_system_prompt,
        allowed_tool_ids, genesis_event_id, public_key, storage_policy, sealed_at,
        provenance_enabled, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      seedId,
      OWNER,
      name,
      'Test bio',
      null,
      JSON.stringify({
        honesty: 0.7,
        emotionality: 0.5,
        extraversion: 0.6,
        agreeableness: 0.7,
        conscientiousness: 0.7,
        openness: 0.7,
      }),
      JSON.stringify({ preLlmClassifier: true, dualLlmAuditor: true, outputSigning: true }),
      JSON.stringify({ profile: 'default' }),
      null,
      'You are a test agent.',
      JSON.stringify([]),
      null,
      null,
      'sealed',
      null,
      1,
      'active',
      now,
      now,
    ]
  );
}

async function addSmtpCredentials(credentials: CredentialsService, seedId: string): Promise<void> {
  // 127.0.0.1:1 refuses at once, so a send that skips the capture fails fast
  // and never leaves the machine.
  for (const [type, value] of [
    ['smtp_host', '127.0.0.1:1'],
    ['smtp_user', 'agent@owner.test'],
    ['smtp_password', 'not-a-real-password'],
    ['smtp_from', 'agent@owner.test'],
  ] as const) {
    await credentials.createCredential(OWNER, { seedId, type, label: type, value });
  }
}

const savedEnv: Record<string, string | undefined> = {};
const ENV_KEYS = [
  'AGENTOS_WORKBENCH_USER_ID',
  'AGENTOS_WORKBENCH_USER_EMAIL',
  'FRONTEND_URL',
  'NODE_ENV',
  'MAIL_DO_NOT_CONTACT',
];

let db: DatabaseService;
let credentials: CredentialsService;
let sent: Captured[];
let transport: ReturnType<typeof captureTransport>['transport'];
let email: EmailIntegrationService;

beforeEach(async () => {
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.AGENTOS_WORKBENCH_USER_ID = OWNER;
  process.env.AGENTOS_WORKBENCH_USER_EMAIL = `${OWNER}@local.dev`;
  process.env.FRONTEND_URL = SITE;
  process.env.NODE_ENV = 'test';
  delete process.env.MAIL_DO_NOT_CONTACT;

  __setAppDatabaseAdapterResolverForTests(async () =>
    resolveStorageAdapter({ priority: ['better-sqlite3'], filePath: ':memory:' })
  );
  await initializeAppDatabase();

  db = new DatabaseService();
  credentials = new CredentialsService(db);
  await insertAgent(db, AGENT_A, 'Scout');
  await insertAgent(db, AGENT_B, 'Herald');
  await addSmtpCredentials(credentials, AGENT_A);
  await addSmtpCredentials(credentials, AGENT_B);

  ({ sent, transport } = captureTransport());
  email = new EmailIntegrationService(db, credentials, transport);
});

afterEach(async () => {
  await closeAppDatabase();
  __setAppDatabaseAdapterResolverForTests();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

async function sendAgentMail(seedId = AGENT_A, to = RECIPIENT, subject = 'Weekly notes') {
  return email.sendEmail(OWNER, { seedId, to, subject, text: 'Here are this week\'s notes.' });
}

describe('agent mail carries an unsubscribe link and the one-click headers', () => {
  it('an agent mail has the footer link and both RFC 8058 headers', async () => {
    await sendAgentMail();
    expect(transport).toHaveBeenCalledTimes(1);
    const { raw } = sent[0];

    const url = unsubscribeUrl(raw);
    expect(url).toMatch(/^https:\/\/wunderland\.test\/api\/email\/unsubscribe\/[A-Za-z0-9_-]{43}$/);
    expect(headerValues(raw, 'List-Unsubscribe')).toHaveLength(1);
    expect(headerValues(raw, 'List-Unsubscribe-Post')).toEqual(['List-Unsubscribe=One-Click']);

    const body = bodyOf(raw);
    expect(body).toContain('Here are this week\'s notes.');
    expect(body).toContain(`Unsubscribe: ${url}`);
    expect(body).toContain('Scout');
    // The link names no account, agent, address or time.
    expect(url).not.toContain(AGENT_A);
    expect(url.toLowerCase()).not.toContain('example.com');
  });

  it('the test mail carries the same footer and headers', async () => {
    await email.sendTestEmail(OWNER, { seedId: AGENT_A, to: RECIPIENT });
    const { raw } = sent[0];
    const url = unsubscribeUrl(raw);
    expect(headerValues(raw, 'List-Unsubscribe-Post')).toEqual(['List-Unsubscribe=One-Click']);
    expect(bodyOf(raw)).toContain(`Unsubscribe: ${url}`);
  });

  it('a subject cannot add header lines', async () => {
    await sendAgentMail(
      AGENT_A,
      RECIPIENT,
      'Hello\r\nList-Unsubscribe: <https://evil.test/x>\r\nBcc: someone@evil.test'
    );
    const { raw } = sent[0];
    expect(headerValues(raw, 'List-Unsubscribe')).toHaveLength(1);
    expect(unsubscribeUrl(raw).startsWith(`${SITE}/`)).toBe(true);
    expect(headerBlock(raw).some((line) => line.toLowerCase().startsWith('bcc:'))).toBe(false);
  });

  it('stores only a hash of the token and no plain address', async () => {
    await sendAgentMail();
    const token = tokenFrom(unsubscribeUrl(sent[0].raw));
    const rows = await db.all<Record<string, unknown>>(
      'SELECT * FROM wunderland_email_unsubscribe_tokens'
    );
    expect(rows).toHaveLength(1);
    const stored = JSON.stringify(rows[0]);
    expect(stored).not.toContain(token);
    expect(stored.toLowerCase()).not.toContain(RECIPIENT.toLowerCase());
    expect(rows[0].token_hash).toBe(createHash('sha256').update(token).digest('hex'));
  });

  it('refuses to send when the site address is not https in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'http://wunderland.test';
    await expect(sendAgentMail()).rejects.toThrow(/https/i);
    process.env.FRONTEND_URL = 'https://wunderland.test/#fragment';
    await expect(sendAgentMail()).rejects.toThrow(/https/i);
    expect(transport).not.toHaveBeenCalled();
  });

  it('never sends to a do-not-contact address', async () => {
    process.env.MAIL_DO_NOT_CONTACT = 'blocked@example.com, other@example.org';
    await expect(sendAgentMail(AGENT_A, ' Blocked@Example.COM ')).rejects.toThrow();
    await expect(
      email.sendTestEmail(OWNER, { seedId: AGENT_B, to: 'other@example.org' })
    ).rejects.toThrow();
    expect(transport).not.toHaveBeenCalled();
  });
});

describe('the unsubscribe route', () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    const { EmailUnsubscribeController } = await import('./email-unsubscribe.controller.js');
    const { EmailUnsubscribeService } = await import('./email-unsubscribe.service.js');
    const moduleRef = await Test.createTestingModule({
      controllers: [EmailUnsubscribeController],
      providers: [EmailUnsubscribeService, DatabaseService],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.setGlobalPrefix('api', { exclude: ['health'] });
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address() as AddressInfo;
    base = `http://127.0.0.1:${port}/api/wunderland/email/unsubscribe`;
  });

  afterAll(async () => {
    await app?.close();
  });

  async function suppressionCount(): Promise<number> {
    const row = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM wunderland_email_suppressions');
    return Number(row?.n ?? 0);
  }

  it('GET only asks: it shows the agent and a masked address, and suppresses nothing', async () => {
    await sendAgentMail();
    const token = tokenFrom(unsubscribeUrl(sent[0].raw));

    const res = await fetch(`${base}/${token}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
    const html = await res.text();
    expect(html).toContain('Scout');
    expect(html).toMatch(/<form[^>]*method="post"/i);
    expect(html).toContain('Unsubscribe');
    expect(html.toLowerCase()).not.toContain(RECIPIENT.toLowerCase());
    expect(await suppressionCount()).toBe(0);

    await sendAgentMail();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('a one-click POST stops that agent at once and sends nothing back', async () => {
    await sendAgentMail();
    const token = tokenFrom(unsubscribeUrl(sent[0].raw));
    const callsBefore = transport.mock.calls.length;

    const res = await fetch(`${base}/${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    });
    expect(res.status).toBe(200);
    expect(transport.mock.calls.length).toBe(callsBefore);

    await expect(sendAgentMail(AGENT_A, 'reader.person@example.com')).rejects.toThrow();
    await expect(
      email.sendTestEmail(OWNER, { seedId: AGENT_A, to: RECIPIENT })
    ).rejects.toThrow();
    expect(transport.mock.calls.length).toBe(callsBefore);

    // Another agent may still write to the address.
    await sendAgentMail(AGENT_B);
    expect(transport.mock.calls.length).toBe(callsBefore + 1);
  });

  it('the page offers every agent: scope=all stops all agent mail to the address', async () => {
    await sendAgentMail();
    const token = tokenFrom(unsubscribeUrl(sent[0].raw));

    const page = await (await fetch(`${base}/${token}`)).text();
    expect(page).toMatch(/name="scope"[^>]*value="all"/);

    const res = await fetch(`${base}/${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'scope=all',
    });
    expect(res.status).toBe(200);

    const callsBefore = transport.mock.calls.length;
    await expect(sendAgentMail(AGENT_A)).rejects.toThrow();
    await expect(sendAgentMail(AGENT_B)).rejects.toThrow();
    expect(transport.mock.calls.length).toBe(callsBefore);
  });

  it('an unknown token is refused and changes nothing', async () => {
    const fake = 'A'.repeat(43);
    expect((await fetch(`${base}/${fake}`)).status).toBe(404);
    const res = await fetch(`${base}/${fake}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    });
    expect(res.status).toBe(404);
    expect(await suppressionCount()).toBe(0);
  });
});

describe('request logs never carry an unsubscribe token', () => {
  it('redacts the token from a logged URL', async () => {
    const { redactMailTokens } = await import('./unsubscribe-token.js');
    const token = 'b'.repeat(43);
    const logged = redactMailTokens(`/api/wunderland/email/unsubscribe/${token}?x=1`);
    expect(logged).not.toContain(token);
    expect(logged).toBe('/api/wunderland/email/unsubscribe/[token]?x=1');
    expect(redactMailTokens(`/api/email/unsubscribe/${token}`)).toBe('/api/email/unsubscribe/[token]');
    expect(redactMailTokens('/api/wunderland/agents')).toBe('/api/wunderland/agents');
  });
});
