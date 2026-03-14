---
title: Library-First API
sidebar_position: 3
---

# Library-First API

Wunderland is easiest to embed through the root import.

```ts
import { createWunderland } from 'wunderland';
```

## Example

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
  skills: ['web-search', 'coding-agent'],
  extensions: {
    tools: ['web-search', 'web-browser'],
    voice: ['speech-runtime'],
  },
});

const session = app.session();
const result = await session.sendText('Review the latest incident summary.');
console.log(result.text);
```

## What You Get

- runtime construction
- session lifecycle
- tools and extensions
- discovery and diagnostics
- approvals
- AgentOS-backed speech runtime integration

## When To Drop Lower

Use lower-level AgentOS modules only when you need primitives that the Wunderland facade intentionally hides. Most teams should stay at the root API.
