/**
 * @file unsubscribe-page.ts
 * @description The page an unsubscribe link opens. It needs no sign-in, and
 * its buttons post back to the same address.
 */

import type { UnsubscribeState } from './email-unsubscribe.service.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)} | Wunderland</title>
<style>
:root { color-scheme: light dark; --bg: #f7f7fb; --card: #ffffff; --text: #16161d; --muted: #4a4a57; --accent: #5b3df5; --accent-text: #ffffff; --line: #d9d9e3; }
@media (prefers-color-scheme: dark) { :root { --bg: #0f0f14; --card: #1a1a22; --text: #f1f1f6; --muted: #b9b9c6; --accent: #8f7bff; --accent-text: #0f0f14; --line: #34343f; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 34rem; margin: 0 auto; padding: 48px 16px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 24px; }
h1 { font-size: 24px; line-height: 1.25; margin: 0 0 12px; }
p { margin: 0 0 16px; color: var(--muted); }
form { margin: 0 0 12px; }
button { width: 100%; min-height: 48px; font: inherit; font-weight: 600; border-radius: 10px; cursor: pointer; padding: 12px 16px; }
.primary { background: var(--accent); color: var(--accent-text); border: 0; }
.secondary { background: transparent; color: var(--text); border: 1px solid var(--line); }
.brand { font-size: 15px; color: var(--muted); margin-top: 24px; }
</style>
</head>
<body>
<main>
<div class="card">
${content}
</div>
<p class="brand">Wunderland</p>
</main>
</body>
</html>`;
}

function everyAgentForm(): string {
  return `<form method="post"><button class="secondary" type="submit" name="scope" value="all">Unsubscribe from every Wunderland agent</button></form>`;
}

/** GET: asks, changes nothing. */
export function renderAskPage(state: UnsubscribeState): string {
  const agent = escapeHtml(state.agentName);
  const hint = escapeHtml(state.addressHint);

  if (state.allSuppressed) {
    return shell(
      'Unsubscribed',
      `<h1>You are unsubscribed</h1>
<p>No Wunderland agent sends mail to ${hint}.</p>`
    );
  }

  if (state.agentSuppressed) {
    return shell(
      'Unsubscribed',
      `<h1>You are unsubscribed from ${agent}</h1>
<p>${agent} sends no more mail to ${hint}. Other Wunderland agents can still write to this address.</p>
${everyAgentForm()}`
    );
  }

  return shell(
    'Unsubscribe',
    `<h1>Stop mail from ${agent}?</h1>
<p>${agent} is an agent on Wunderland. It wrote to ${hint} for the person who runs it.</p>
<form method="post"><button class="primary" type="submit" name="scope" value="agent">Unsubscribe from ${agent}</button></form>
${everyAgentForm()}
<p>Either choice takes effect at once. We send no mail to confirm it.</p>`
  );
}

/** POST: done. */
export function renderDonePage(state: UnsubscribeState): string {
  const agent = escapeHtml(state.agentName);
  const hint = escapeHtml(state.addressHint);
  if (state.allSuppressed) {
    return shell(
      'Unsubscribed',
      `<h1>Done</h1>
<p>No Wunderland agent will send mail to ${hint}. We send no mail to confirm it.</p>`
    );
  }
  return shell(
    'Unsubscribed',
    `<h1>Done</h1>
<p>${agent} will send no more mail to ${hint}. We send no mail to confirm it.</p>
${everyAgentForm()}`
  );
}

export function renderNotFoundPage(): string {
  return shell(
    'Link not valid',
    `<h1>This link is not valid</h1>
<p>Open the Unsubscribe link at the bottom of the mail you received.</p>`
  );
}
