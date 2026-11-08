import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service.js';
import { CredentialsService } from '../credentials/credentials.service.js';
import { EmailUnsubscribeService } from './email-unsubscribe.service.js';
import { sendSmtpMail, type SmtpSendParams } from './smtp-client.js';
import { MailLinkConfigError, siteBaseUrl, unsubscribeLink } from './unsubscribe-token.js';

/** The SMTP connection. Tests replace it; production uses sendSmtpMail. */
export type SmtpTransport = (
  params: SmtpSendParams
) => Promise<{ ok: true; serverResponse: string }>;

export const SMTP_TRANSPORT = Symbol('SMTP_TRANSPORT');

/** What a refused send says. The same words for an unsubscribe and the do-not-contact list. */
export const SUPPRESSED_MESSAGE = 'The recipient has turned off this mail. Nothing was sent.';

export type EmailIntegrationStatus = {
  configured: boolean;
  required: string[];
  present: string[];
  missing: string[];
};

@Injectable()
export class EmailIntegrationService {
  private readonly transport: SmtpTransport;
  private readonly unsubscribe: EmailUnsubscribeService;

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(CredentialsService) private readonly credentials: CredentialsService,
    @Optional() @Inject(SMTP_TRANSPORT) transport?: SmtpTransport,
    @Optional() @Inject(EmailUnsubscribeService) unsubscribe?: EmailUnsubscribeService
  ) {
    this.transport = transport ?? sendSmtpMail;
    this.unsubscribe = unsubscribe ?? new EmailUnsubscribeService(db);
  }

  private async requireOwnedAgent(userId: string, seedId: string): Promise<{ name: string }> {
    const row = await this.db.get<{ seed_id: string; display_name: string | null }>(
      `SELECT seed_id, display_name FROM wunderbots WHERE seed_id = ? AND owner_user_id = ? AND status != 'archived' LIMIT 1`,
      [seedId, userId]
    );
    if (!row) {
      throw new NotFoundException(`Agent "${seedId}" not found or not owned by current user.`);
    }
    const name = String(row.display_name ?? '')
      .replace(/[\u0000-\u001f\u007f"]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    return { name: name || seedId };
  }

  /**
   * Every agent mail goes out here: the recipient is checked against the
   * do-not-contact list and the suppressions first, then the mail gets its
   * own unsubscribe token, the footer link and the RFC 8058 headers.
   */
  private async deliver(params: {
    seedId: string;
    agentName: string;
    smtp: { host: string; user: string; pass: string };
    from: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<{ ok: true; serverResponse: string }> {
    let link: string;
    try {
      // The mail needs a working https unsubscribe link and stored
      // unsubscribes must still match; otherwise nothing is stored or sent.
      // The server key is recorded only when the first token is issued.
      const site = siteBaseUrl();
      await this.unsubscribe.assertAddressKeyUnchanged();
      if (await this.unsubscribe.isSuppressed(params.to, params.seedId)) {
        throw new ConflictException(SUPPRESSED_MESSAGE);
      }
      const token = await this.unsubscribe.issueToken({
        recipient: params.to,
        seedId: params.seedId,
        agentName: params.agentName,
      });
      link = unsubscribeLink(token, site);
    } catch (err) {
      if (err instanceof MailLinkConfigError) throw new ServiceUnavailableException(err.message);
      throw err;
    }

    const footer = [
      '',
      '-- ',
      `You got this mail from "${params.agentName}", an agent on Wunderland, sent for the person who runs it.`,
      `Unsubscribe: ${link}`,
    ].join('\n');

    return this.transport({
      host: params.smtp.host,
      user: params.smtp.user,
      pass: params.smtp.pass,
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: `${params.text.trimEnd()}\n${footer}\n`,
      requireTLS: true,
      headers: {
        'List-Unsubscribe': `<${link}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  }

  /** A trimmed address with one @ and a dot after it, and none of the characters that would end an SMTP path. */
  private validateEmail(value: string, field: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new BadRequestException(`${field} is required.`);
    // Lightweight validation; SMTP will be the ultimate authority.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || /[<>(),;:"[\]\\]/.test(trimmed)) {
      throw new BadRequestException(`${field} must be a valid email address.`);
    }
    return trimmed;
  }

  async getStatus(userId: string, seedId: string): Promise<EmailIntegrationStatus> {
    const normalizedSeedId = seedId.trim();
    await this.requireOwnedAgent(userId, normalizedSeedId);

    const required = ['smtp_host', 'smtp_user', 'smtp_password'] as const;

    const rows = await this.db.all<{ credential_type: string }>(
      `
        SELECT credential_type
          FROM wunderbot_credentials
         WHERE owner_user_id = ?
           AND seed_id = ?
           AND credential_type IN (${required.map(() => '?').join(',')})
      `,
      [userId, normalizedSeedId, ...required]
    );

    const presentSet = new Set(rows.map((r) => String(r.credential_type)));
    const present = required.filter((t) => presentSet.has(t));
    const missing = required.filter((t) => !presentSet.has(t));

    return {
      configured: missing.length === 0,
      required: [...required],
      present: [...present],
      missing: [...missing],
    };
  }

  async sendTestEmail(
    userId: string,
    payload: {
      seedId: string;
      to: string;
      subject?: string;
      text?: string;
      from?: string;
    }
  ): Promise<{ ok: true; serverResponse: string }> {
    const seedId = payload.seedId.trim();
    const agent = await this.requireOwnedAgent(userId, seedId);

    const to = this.validateEmail(payload.to, 'to');
    const fromOverride = payload.from?.trim();
    const subject = (payload.subject?.trim() || 'Wunderland SMTP Test').slice(0, 160);
    const text =
      (payload.text?.trim() ||
        `SMTP integration is live.\n\nseedId: ${seedId}\n\nIf you received this email, your Wunderbot can send outbound email.`) +
      '\n';

    const creds = await this.credentials.getDecryptedValuesByType(userId, seedId, [
      'smtp_host',
      'smtp_user',
      'smtp_password',
      'smtp_from',
    ]);

    const smtpHost = creds.smtp_host?.trim() ?? '';
    const smtpUser = creds.smtp_user?.trim() ?? '';
    const smtpPass = creds.smtp_password ?? '';
    const smtpFrom = creds.smtp_from?.trim() ?? '';

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new BadRequestException(
        'Email integration is not configured. Add smtp_host, smtp_user, and smtp_password in Credential Vault.'
      );
    }

    const from = this.validateEmail(fromOverride || smtpFrom || smtpUser, 'from');

    const result = await this.deliver({
      seedId,
      agentName: agent.name,
      smtp: { host: smtpHost, user: smtpUser, pass: smtpPass },
      from,
      to,
      subject,
      text,
    });

    return { ok: true, serverResponse: result.serverResponse };
  }

  async sendEmail(
    userId: string,
    payload: {
      seedId: string;
      to: string;
      from?: string;
      subject: string;
      text: string;
    }
  ): Promise<{ ok: true; serverResponse: string }> {
    const seedId = payload.seedId.trim();
    const agent = await this.requireOwnedAgent(userId, seedId);

    const to = this.validateEmail(payload.to, 'to');
    const fromOverride = payload.from?.trim();
    const subject = (payload.subject || '').trim();
    const text = (payload.text || '').trim();

    if (!subject) throw new BadRequestException('subject is required.');
    if (!text) throw new BadRequestException('text is required.');

    const creds = await this.credentials.getDecryptedValuesByType(userId, seedId, [
      'smtp_host',
      'smtp_user',
      'smtp_password',
      'smtp_from',
    ]);

    const smtpHost = creds.smtp_host?.trim() ?? '';
    const smtpUser = creds.smtp_user?.trim() ?? '';
    const smtpPass = creds.smtp_password ?? '';
    const smtpFrom = creds.smtp_from?.trim() ?? '';

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new BadRequestException(
        'Email integration is not configured. Add smtp_host, smtp_user, and smtp_password in Credential Vault.'
      );
    }

    const from = this.validateEmail(fromOverride || smtpFrom || smtpUser, 'from');

    const result = await this.deliver({
      seedId,
      agentName: agent.name,
      smtp: { host: smtpHost, user: smtpUser, pass: smtpPass },
      from,
      to,
      subject: subject.slice(0, 160),
      text,
    });

    return { ok: true, serverResponse: result.serverResponse };
  }
}
