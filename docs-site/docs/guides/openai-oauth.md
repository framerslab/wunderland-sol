---
sidebar_position: 23
title: OpenAI OAuth Login
description: Use your ChatGPT Plus/Pro subscription for API access via OAuth
---

# OpenAI OAuth Login

Wunderland supports authenticating with OpenAI using the same OAuth device code flow as the [Codex CLI](https://github.com/openai/codex). This lets you use your existing ChatGPT Plus ($20/mo) or Pro ($200/mo) subscription's API credits without creating a separate API key.

## How It Works

OpenAI bundles API credits with consumer subscriptions:

| Plan | Monthly Price | Included API Credits |
|------|--------------|---------------------|
| ChatGPT Plus | $20/mo | $5/mo |
| ChatGPT Pro | $200/mo | $50/mo |

The OAuth device code flow authenticates through your OpenAI account and returns a standard Bearer token that works with the `/v1/chat/completions` endpoint -- identical to a regular API key.

### Flow

1. `wunderland login` requests a device code from OpenAI
2. You visit [platform.openai.com/device](https://platform.openai.com/device) and enter the displayed code
3. The CLI polls until authorization completes
4. Tokens are exchanged and stored locally at `~/.wunderland/auth/openai.json`
5. Subsequent LLM calls use the stored token, auto-refreshing when expired

## CLI Commands

### Login

```bash
wunderland login                    # Default: OpenAI
wunderland login --provider openai  # Explicit
```

Displays a user code and verification URL. After you authorize in your browser, tokens are stored locally.

### Check Status

```bash
wunderland auth-status
```

Shows:
- Whether you're authenticated
- Token expiry time
- Whether a refresh token is available

### Logout

```bash
wunderland logout
```

Deletes stored tokens from `~/.wunderland/auth/openai.json`.

## Configuration

### agent.config.json

```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o",
  "llmAuthMethod": "oauth"
}
```

When `llmAuthMethod` is set to `"oauth"`, the CLI and library automatically resolve credentials from stored OAuth tokens instead of the `OPENAI_API_KEY` environment variable.

### Init Wizard

The `wunderland init` wizard offers OAuth as an option when selecting OpenAI:

```
? Which LLM provider do you want to use?
  > OpenAI (API Key)
  > OpenAI (Subscription)    <-- uses OAuth
  > Anthropic
  > Ollama (local)
  ...
```

### Library API

```typescript
import { createWunderland } from 'wunderland';

// Option 1: Via agentConfig (recommended)
const app = await createWunderland({
  agentConfig: {
    llmProvider: 'openai',
    llmModel: 'gpt-4o',
    llmAuthMethod: 'oauth',
  },
});

// Option 2: Explicit getApiKey
import { OpenAIOAuthFlow, FileTokenStore } from '@framers/agentos/auth';

const flow = new OpenAIOAuthFlow({ tokenStore: new FileTokenStore() });

const app2 = await createWunderland({
  llm: {
    providerId: 'openai',
    apiKey: '',
    model: 'gpt-4o',
    getApiKey: () => flow.getAccessToken(),
  },
});
```

## Token Storage

| Item | Details |
|------|---------|
| Location | `~/.wunderland/auth/openai.json` |
| Permissions | `0o600` (owner read/write only) |
| Format | JSON: `{ accessToken, refreshToken, expiresAt }` |
| Auto-refresh | Yes, 5-minute buffer before expiry |
| Concurrent safety | Mutex prevents simultaneous refresh races |

## Security Considerations

- Tokens are stored with restrictive file permissions (`0o600`)
- The refresh token enables automatic token renewal without re-authentication
- The client ID (`app_EMoamEEZ73f0CkXaXp7hrann`) is the same public client ID used by the Codex CLI
- No tokens are sent to any server other than `auth.openai.com` and `api.openai.com`

## Provider Extensibility

The auth module is built on generic interfaces that support future OAuth providers:

```typescript
// Core interfaces (from @framers/agentos/auth)
interface IOAuthFlow {
  readonly providerId: string;
  authenticate(): Promise<OAuthTokenSet>;
  refresh(tokens: OAuthTokenSet): Promise<OAuthTokenSet>;
  isValid(tokens: OAuthTokenSet): boolean;
  getAccessToken(): Promise<string>;
}

interface IOAuthTokenStore {
  load(providerId: string): Promise<OAuthTokenSet | null>;
  save(providerId: string, tokens: OAuthTokenSet): Promise<void>;
  clear(providerId: string): Promise<void>;
}
```

To add a new provider, implement `IOAuthFlow` for that provider's OAuth endpoints and register it. The `FileTokenStore` is provider-agnostic and works with any `providerId`.

### Why Only OpenAI?

| Provider | OAuth Support | Notes |
|----------|--------------|-------|
| **OpenAI** | Supported | Codex CLI device code flow, legitimate public client |
| Anthropic | Not available | No consumer OAuth API; session tokens violate ToS |
| Google | Not available | Gemini API uses API keys only; Google OAuth doesn't grant API access |
| Other providers | Not available | No equivalent consumer subscription OAuth flows |

Anthropic and Google explicitly prohibit reusing consumer session tokens for API access in their Terms of Service. If any provider adds a legitimate OAuth flow in the future, it can be integrated by implementing the `IOAuthFlow` interface -- no architectural changes needed.

## Troubleshooting

### "No OpenAI OAuth tokens found"

Run `wunderland login` to authenticate. This error appears when you set `llmAuthMethod: 'oauth'` but haven't logged in yet.

### "Token expired" in auth-status

If a refresh token is available, it will auto-refresh on the next API call. If no refresh token exists, run `wunderland login` again.

### "@framers/agentos/auth module not found"

Ensure `@framers/agentos` is installed and its `./auth` subpath export is available. This is automatically resolved in the Wunderland monorepo.

## Related

- [Model Providers](./model-providers.md) -- all 13 supported providers
- [CLI Reference](./cli-reference.md) -- full command documentation
- [Library API](./library-first-api.md) -- programmatic usage
