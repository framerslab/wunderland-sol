---
title: API Overview
sidebar_position: 1
---

# API Overview

The primary public API is the root import:

```ts
import { createWunderland } from 'wunderland';
```

Use it when you want:

- app lifecycle setup
- per-session chat turns
- curated tools and skills
- extension loading
- diagnostics

## Minimal Example

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
});

const session = app.session();
const result = await session.sendText('Summarize the last deploy issue.');

console.log(result.text);
```

## Core Concepts

- `createWunderland(options)` creates the runtime host.
- `app.session()` creates an interactive turn session.
- `session.sendText()` runs a user turn through prompting, tool calling, approvals, and response generation.
- `app.diagnostics()` reports loaded tools, skills, discovery state, and extension details.

## Configuration Surface

The high-level `WunderlandOptions` type covers:

- `llm`
- `tools`
- `skills`
- `extensions`
- `preset`
- `approvals`
- `discovery`
- `agentConfig`

See the generated pages under [Type Aliases](/docs/api-reference/type-aliases/WunderlandOptions) for the detailed type contract.

## Speech Runtime

Speech is enabled through the extension catalog and the AgentOS speech runtime:

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
  },
});
```

Continue with the [Voice Runtime guide](../guides/voice-runtime) for provider selection and CLI flows.
