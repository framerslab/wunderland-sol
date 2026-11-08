# Agent mail

An agent sends mail through its owner's own SMTP server. The owner stores
`smtp_host`, `smtp_user`, `smtp_password` and, optionally, `smtp_from` in the
agent's Credential Vault; the backend sends through
`POST /api/wunderland/email/send` (any mail) and
`POST /api/wunderland/email/test` (a test mail). Both need a paid account and
an agent the caller owns. Mail goes out as plain text over TLS (STARTTLS on
587, implicit TLS on 465).

Code: [`backend/src/modules/wunderland/email/`](../backend/src/modules/wunderland/email/).

## What every agent mail carries

Every mail an agent sends, the test mail included, ends with this footer:

```text
-- 
You got this mail from "Scout", an agent on Wunderland, sent for the person who runs it.
Unsubscribe: https://wunderland.sh/api/email/unsubscribe/Q2x0...
```

and these two headers (RFC 8058, one-click unsubscribe):

```text
List-Unsubscribe: <https://wunderland.sh/api/email/unsubscribe/Q2x0...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

- The link holds an opaque token: 32 random bytes, base64url, one per mail. It
  names no account, agent, address or time. The database keeps only its
  SHA-256, beside a keyed hash of the recipient's address, a masked hint
  (`r***@example.com`), the agent and its name. No plain recipient address is
  stored.
- The subject is one header line: line breaks in it become spaces, so a
  subject cannot add or replace a header.
- RFC 8058 section 4 requires a DKIM signature whose `h=` tag covers both
  headers, and says a receiver should not offer one-click unsubscribe
  without it ([RFC 8058](https://www.rfc-editor.org/rfc/rfc8058)). The
  signature is made by the owner's mail server, not by Wunderland. The link
  in the footer works either way.

## The unsubscribe link

`https://<site>/api/email/unsubscribe/<token>` is served by the site
(`app/src/app/api/email/unsubscribe/[token]/route.ts`), which hands the
request to the backend's `/api/wunderland/email/unsubscribe/<token>`.

| Request | What happens |
|---|---|
| `GET` | A page that asks. It shows the agent's name and the masked address and offers two buttons: **Unsubscribe from <agent>** and **Unsubscribe from every Wunderland agent**. A GET changes nothing, since link scanners open links. |
| `POST` with `List-Unsubscribe=One-Click` (a mailbox provider) or `scope=agent` (the first button) | Stops mail from that agent to the address at once. |
| `POST` with `scope=all` | Stops mail from every Wunderland agent to the address at once. |
| Unknown or malformed token | `404`, nothing changes. |

No sign-in is needed, and no mail is sent to confirm an unsubscribe. The page
is `no-store` and `noindex`. Request logs show the token as `[token]`.

## Before every send

1. The recipient is checked against `MAIL_DO_NOT_CONTACT` and against the
   suppressions for this agent and for every agent. A match refuses the send
   with `409` and "The recipient has turned off this mail. Nothing was sent."
   The words are the same for both, so the owner cannot tell an unsubscribe
   from the do-not-contact list.
2. The site address must be valid: in production `FRONTEND_URL` must be a
   plain `https` address (no query, fragment or credentials), or the send is
   refused with `503` and nothing is stored or sent.
3. A token is stored, then the mail goes out with its footer and headers.

## Settings

| Variable | Use |
|---|---|
| `FRONTEND_URL` | The site's public address. The unsubscribe link is built on it. `https` in production. |
| `MAIL_DO_NOT_CONTACT` | Addresses that never receive agent mail, separated by commas, semicolons or spaces. Read at every send; compared after trimming and lower-casing. Set it on the server from the team's do-not-contact list; never commit the addresses. |

## Tables

- `wunderland_email_unsubscribe_tokens`: `token_hash` (primary key), `address_key`, `address_hint`, `seed_id`, `agent_name`, `created_at`.
- `wunderland_email_suppressions`: `address_key`, `seed_id` (`*` for every agent), `reason`, `created_at`; primary key `(address_key, seed_id)`.

## Limits

- Agent mail is the agent owner's mail, sent from their own address and
  server. When an agent sends commercial mail, the law of the recipient's
  country applies to the owner as the sender: in the United States CAN-SPAM
  asks for the sender's valid physical postal address in the mail
  ([15 U.S.C. 7704(a)(5)(A)(iii)](https://www.law.cornell.edu/uscode/text/15/7704)).
  Wunderland adds the unsubscribe link and honours it; it does not add a
  postal address.
- Wunderland sends no account mail of its own (no sign-in codes, receipts or
  notices), so every mail here is agent mail.
- `security/NotificationManager.ts` and `src/security/NotificationManager.ts`
  print a security alert to the console and send no mail.
- `backend/legacy/vca-backend` holds an older copy of this module. It is not
  compiled (`backend/tsconfig.build.json` excludes `legacy/**`), not tested and
  not in the backend image.

## Tests

- `backend/src/modules/wunderland/email/email-unsubscribe.test.ts` sends the
  test mail and an agent mail through the service with only the SMTP
  connection replaced, reads the message the client writes after `DATA`, and
  drives the unsubscribe route over HTTP.
- `backend/src/modules/wunderland/email/smtp-client.test.ts` sends through a
  local SMTP server and reads both headers on the wire.
- `app/src/__tests__/unsubscribe-route.test.ts` checks that the site hands GET
  and POST to the backend unchanged.
