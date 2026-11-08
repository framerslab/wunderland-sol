/**
 * @file email-unsubscribe.controller.ts
 * @description The unsubscribe route behind the link in every agent mail.
 *
 * GET /api/wunderland/email/unsubscribe/:token only shows a page that asks:
 * link scanners open links, so a GET never suppresses.
 * POST suppresses at once, with no sign-in and no confirmation mail. A
 * mailbox provider's RFC 8058 one-click POST (List-Unsubscribe=One-Click)
 * and the page's first button stop mail from that agent; scope=all stops
 * mail from every Wunderland agent to the address.
 */

import { Body, Controller, Get, Inject, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { EmailUnsubscribeService, type UnsubscribeScope } from './email-unsubscribe.service.js';
import { renderAskPage, renderDonePage, renderNotFoundPage } from './unsubscribe-page.js';

/** Sends an unsubscribe page: no-store, noindex, no referrer, a strict CSP. */
function sendPage(res: Response, status: number, html: string): void {
  res
    .status(status)
    .set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    })
    .send(html);
}

/** 'all' only when the form asks for every agent; a one-click body or anything else stops one agent. */
function scopeFrom(body: unknown): UnsubscribeScope {
  const scope = body && typeof body === 'object' ? (body as Record<string, unknown>).scope : undefined;
  return scope === 'all' ? 'all' : 'agent';
}

@Controller('wunderland/email/unsubscribe')
export class EmailUnsubscribeController {
  constructor(
    @Inject(EmailUnsubscribeService) private readonly unsubscribe: EmailUnsubscribeService
  ) {}

  @Get(':token')
  async ask(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const state = await this.unsubscribe.lookup(String(token ?? ''));
    if (!state) {
      sendPage(res, 404, renderNotFoundPage());
      return;
    }
    sendPage(res, 200, renderAskPage(state));
  }

  @Post(':token')
  async confirm(
    @Param('token') token: string,
    @Body() body: unknown,
    @Res() res: Response
  ): Promise<void> {
    const state = await this.unsubscribe.unsubscribe(String(token ?? ''), scopeFrom(body));
    if (!state) {
      sendPage(res, 404, renderNotFoundPage());
      return;
    }
    sendPage(res, 200, renderDonePage(state));
  }
}
