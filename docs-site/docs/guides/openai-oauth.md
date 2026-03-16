---
sidebar_position: 23
title: OpenAI OAuth Login
description: Current status of OpenAI OAuth support in Wunderland
---

# OpenAI OAuth Login

OpenAI OAuth login is currently **not available** in Wunderland.

The older subscription-based flow relied on a public client configuration that should not be used by third-party applications. Wunderland now blocks that path in the CLI and library-facing config resolution until a first-party OAuth application is registered.

## What To Use Instead

Use an OpenAI API key:

```bash
wunderland login
# choose: OpenAI (API Key)
```

Or configure it directly:

```bash
export OPENAI_API_KEY=your_key_here
```

```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o",
  "llmAuthMethod": "api-key"
}
```

## CLI Status

- `wunderland login` shows the subscription option as unavailable.
- `wunderland init` shows the subscription option as unavailable.
- `wunderland chat --oauth` is rejected.
- `llmAuthMethod: "oauth"` is rejected by the current runtime config path.

## Why It Was Disabled

- Third-party reuse of a public OAuth client is not acceptable for a shipped application.
- The previous flow created product and Terms-of-Service risk.
- Keeping the code path half-enabled would produce confusing behavior across CLI and library APIs.

## Migration

If you still have older configs that mention:

```json
{
  "llmAuthMethod": "oauth"
}
```

change them to:

```json
{
  "llmAuthMethod": "api-key"
}
```

and provide `OPENAI_API_KEY`.

## Related

- [Model Providers](./model-providers.md)
- [Gemini Setup](./gemini-setup.md)
- [Library-First API](./library-first-api.md)
