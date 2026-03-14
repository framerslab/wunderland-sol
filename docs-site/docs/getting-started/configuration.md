---
title: Configuration
sidebar_position: 3
---

# Configuration

Wunderland merges configuration from three places:

1. Environment variables
2. `agent.config.json`
3. Runtime options passed to `createWunderland()`

Explicit runtime options win over preset defaults, and explicit preset overrides win over registry defaults.

## Minimal Runtime Config

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },  // or 'anthropic', 'gemini', 'ollama', 'openrouter'
  tools: 'curated',
});
```

## Common Sections

### LLM

```ts
llm: {
  providerId: 'openai',      // 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter'
  model: 'gpt-4o',           // provider-specific model ID
}
```

For Ollama (local or remote):

```ts
llm: {
  providerId: 'ollama',
  model: 'dolphin-llama3:8b',
  baseUrl: 'http://localhost:11434',  // or remote URL
}
```

See [LLM Provider Setup](../guides/llm-providers) for all provider details.

### Tools

```ts
tools: 'curated'
```

Or mix curated and custom tools:

```ts
tools: {
  curated: {},
  custom: [myTool],
}
```

### Skills

```ts
skills: ['github', 'web-search', 'coding-agent']
```

Or load everything in the current curated registry:

```ts
skills: 'all'
```

### Extensions

```ts
extensions: {
  tools: ['web-search', 'web-browser'],
  voice: ['speech-runtime'],
}
```

### Discovery

```ts
discovery: {
  recallProfile: 'aggressive',
}
```

### Approvals

```ts
approvals: {
  mode: 'deny-side-effects',
}
```

## Speech Runtime Configuration

The speech stack is configured through runtime/provider choice plus environment secrets:

- OpenAI-backed STT/TTS via `OPENAI_API_KEY`
- ElevenLabs TTS / cloning via `ELEVENLABS_API_KEY`
- local providers via installed binaries/models

The high-level runtime enablement remains:

```ts
extensions: {
  voice: ['speech-runtime'],
}
```

Then use CLI commands or the library speech runtime to select the active provider per session.

## Agent Config File

For operator-driven deployments, Wunderland also reads `agent.config.json`. Use it when you want stable local configuration checked into an agent project instead of passing everything programmatically.

Continue with the [Agent Config Reference](./agent-config-reference) for the high-signal keys.
