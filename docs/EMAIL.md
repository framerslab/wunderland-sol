# Agent mail

An agent sends mail through its owner's own SMTP server. The owner stores
`smtp_host`, `smtp_user`, `smtp_password` and, optionally, `smtp_from` in the
agent's Credential Vault; the backend sends through
`POST /api/wunderland/email/send` (any mail) and
`POST /api/wunderland/email/test` (a test mail). Both need a paid account and
an agent the caller owns. Mail goes out as plain text over TLS (STARTTLS on
587, implicit TLS on 465). It stays 7-bit clean: an ASCII body is sent as
`7bit`; a body with any other character (an agent's name such as "Zoë", a
subject in another script) is sent as UTF-8 in `base64`, 76 characters a line,
and such a subject as RFC 2047 encoded words
([RFC 2045](https://www.rfc-editor.org/rfc/rfc2045),
[RFC 2047](https://www.rfc-editor.org/rfc/rfc2047)).

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
  SHA-256, beside the recipient's address keyed with the server secret
  (HMAC-SHA256), a masked hint (`r***@example.com`), the agent and its name.
  No plain recipient address is stored, and a copy of the database alone
  cannot confirm a guessed address.
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
| `GET` | A page that asks. It shows the agent's name and the masked address and offers two buttons: **Unsubscribe from** *the agent's name* and **Unsubscribe from every Wunderland agent**. A GET changes nothing, since link scanners open links. |
| `POST` with `List-Unsubscribe=One-Click` (a mailbox provider) or `scope=agent` (the first button) | Stops mail from that agent to the address at once. |
| `POST` with `scope=all` | Stops mail from every Wunderland agent to the address at once. |
| Unknown, malformed or expired token | `404`, nothing changes. |

No sign-in is needed, and no mail is sent to confirm an unsubscribe. The page
is `no-store` and `noindex`. The site passes the backend a form body only
(any other body is dropped unread, which stops mail from that one agent),
refuses a form body over 8 KB with `413` without reading the rest, and serves
only an HTML reply as the page. The route's own path,
`/api/wunderland/email/unsubscribe/<token>`, is outside the public rate limit,
since every anonymous request through the site shares one address; a request
that only names that path in its query or deeper in another route is limited
as usual. Request logs show the token as `[token]`. nginx
(`deployment/nginx.conf`) does not log these requests and limits them to 5 a
second per client (a burst of 20, then `429`). The client is the
`CF-Connecting-IP` Cloudflare sends, so people behind one Cloudflare edge do
not share a limit, or the connecting address when that header is absent. A
looser limit per connecting address (50 a second, a burst of 200) holds a
caller that reaches the server directly and invents that header. Its
refusals are logged at `info`
([`limit_req_log_level`](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req_log_level)),
below the `notice` level of the `nginx:alpine` image's error log
([its `nginx.conf`](https://github.com/nginx/pkg-oss/blob/master/alpine/alpine/nginx.conf)),
so the token stays out of that log too.

A link works for two years after its mail, well past the 30 days CAN-SPAM
asks for ([15 U.S.C. 7704(a)(3)(A)(ii)](https://www.law.cornell.edu/uscode/text/15/7704)).
Older tokens are dropped when the backend starts, once a day after that, and
before each new token is stored; the unsubscribe a link made never lapses.

## Before every send

1. The site address must be valid: `FRONTEND_URL` must be the site's bare
   origin, `https` in production (no path, query, fragment or credentials),
   since the site serves the link at its root. Otherwise the send is refused
   with `503` and nothing is stored or sent.
2. The server secret must be the one unsubscribes were stored under. The
   first token stores a check value of it; if the secret changes later, every
   send is refused with `503` until the old one is restored, so stored
   unsubscribes never stop matching unnoticed. A send refused before any
   token exists stores nothing, so a setup error can still be corrected. In
   production a send without any secret is refused the same way. Outside
   production (`NODE_ENV` other than `production`) a missing secret falls
   back to a fixed development key, so a server holding real addresses runs
   with `NODE_ENV=production`, as `docker-compose.yml` and both Dockerfiles
   set it.
3. The recipient is checked against `MAIL_DO_NOT_CONTACT` and against the
   suppressions for this agent and for every agent. A match refuses the send
   with `409` and "The recipient has turned off this mail. Nothing was sent."
   The words are the same for both, so the owner cannot tell an unsubscribe
   from the do-not-contact list.
4. Tokens older than two years are dropped, a token is stored, then the mail
   goes out with its footer and headers.

## Settings

| Variable | Use |
|---|---|
| `FRONTEND_URL` | The site's public origin, with no path. The unsubscribe link is built on it. `https` in production. |
| `WUNDERLAND_CREDENTIALS_ENCRYPTION_KEY` | The Credential Vault's key; recipient addresses are keyed with it (with `JWT_SECRET` when it is unset). Set it once: changing it stops agent mail until it is restored. |
| `MAIL_DO_NOT_CONTACT` | Addresses that never receive agent mail, separated by commas, semicolons or spaces. Read at every send; compared after trimming and lower-casing. Set it on the server from the team's do-not-contact list; never commit the addresses. |

## Tables

- `wunderland_email_unsubscribe_tokens`: `token_hash` (primary key), `address_key`, `address_hint`, `seed_id`, `agent_name`, `created_at` (`BIGINT`, milliseconds, indexed for the two-year drop).
- `wunderland_email_suppressions`: `address_key`, `scope` (`agent` or `all`), `seed_id` (empty for `all`), `reason`, `created_at`; primary key `(address_key, scope, seed_id)`.
- `wunderland_email_settings`: `name`, `value`; holds the check value of the server secret.

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
  connection replaced, reads the message the client writes after `DATA`
  (non-ASCII mail included), drives the unsubscribe route over HTTP, expired
  links included, and checks that expired tokens are dropped at start and
  daily with no further mail.
- `backend/src/modules/wunderland/email/smtp-client.test.ts` sends through a
  local SMTP server and reads both headers on the wire.
- `app/src/__tests__/unsubscribe-route.test.ts` checks that the site hands GET
  and POST to the backend, sends it a form body only, refuses an oversized
  body without forwarding it, and never serves a non-HTML reply as the page.
- `backend/src/__tests__/rate-limit.unsubscribe.test.ts` checks that the
  public rate limit never stops an unsubscribe and still limits every other
  path.
