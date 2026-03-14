---
title: Quickstart
sidebar_position: 2
---

# Quickstart

This page gives you the shortest reliable path to a working Wunderland agent.

## Option 1: CLI And TUI

```bash
npm install -g wunderland

# Set your preferred provider's API key
export OPENAI_API_KEY=sk-...          # OpenAI
# export ANTHROPIC_API_KEY=sk-ant-... # or Anthropic
# export GEMINI_API_KEY=AIza...       # or Gemini
# export OPENROUTER_API_KEY=sk-or-... # or OpenRouter

wunderland setup    # interactive provider/model selection
wunderland start
```

In a second terminal:

```bash
wunderland chat
```

Useful follow-ups:

```bash
wunderland doctor
wunderland help getting-started
wunderland help voice
```

## Option 2: Library Embedding

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  // Any supported provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter'
  llm: { providerId: 'openai' },
  tools: 'curated',
  skills: ['web-search', 'summarize'],
  extensions: {
    tools: ['web-search'],
    voice: ['speech-runtime'],
  },
});

const session = app.session();
const result = await session.sendText('Research the latest TypeScript 5.x changes.');

console.log(result.text);
```

## Option 3: Start From A Preset

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  preset: 'research-assistant',
});
```

Presets are the fastest way to get a coherent toolset, skills mix, and personality baseline without manually assembling every dependency.

## Voice Smoke Test

If speech providers are configured:

```bash
wunderland voice tts
wunderland voice stt
wunderland voice test "Hello from Wunderland"
```

The current CLI voice surface covers:

- `status` for telephony/provider readiness
- `tts` for text-to-speech stacks
- `stt` for speech-to-text stacks
- `test <text>` for a synthesis smoke test
- `clone` for cloning-capable provider guidance

## Next Steps

- [Configuration](./configuration)
- [LLM Provider Setup](../guides/llm-providers) — Configure OpenAI, Anthropic, Gemini, Ollama, or OpenRouter
- [Local LLM Setup](../guides/local-llm-setup) — Run models locally with Ollama
- [Creating Agents](../guides/creating-agents)
- [Extensions](../guides/extensions)
- [Voice Runtime](../guides/voice-runtime)
