---
title: Extensions
sidebar_position: 4
---

# Extensions

Extensions are runtime code packs resolved from the curated AgentOS extension registry.

## Main Categories You Will Use

- tool extensions such as `web-search`, `web-browser`, and `cli-executor`
- voice/runtime extensions such as `speech-runtime`
- channel adapters for messaging and social delivery

## Basic Example

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    tools: ['web-search', 'web-browser'],
    voice: ['speech-runtime'],
  },
});
```

## Overrides

Use overrides when you need to change priority, options, or enablement:

```ts
extensions: {
  tools: ['web-search'],
  voice: ['speech-runtime'],
  overrides: {
    'speech-runtime': {
      priority: 20,
    },
  },
}
```

## Skills vs Extensions

- skills are prompt modules
- extensions are executable runtime code

You usually want both.
