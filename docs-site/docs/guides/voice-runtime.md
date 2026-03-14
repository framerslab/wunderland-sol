---
title: Voice Runtime
sidebar_position: 7
---

# Voice Runtime

Wunderland now uses the shared AgentOS speech runtime rather than a one-off voice stack.

## What It Covers

- STT provider abstraction
- TTS provider abstraction
- VAD/silence-aware session behavior
- telephony/provider status in the CLI
- provider switching behind one high-level runtime surface

## Enable It

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
  },
});
```

## First Commands To Run

```bash
wunderland help voice
wunderland voice status
wunderland voice tts
wunderland voice stt
wunderland voice test "Hello from Wunderland"
```

## Current Provider Paths

- OpenAI-backed speech for fast cloud setup
- ElevenLabs for higher-end TTS / cloning flows
- local adapters when installed through the runtime/provider stack

## Operational Advice

- stabilize text flows before enabling speech
- use `voice test` as the first smoke test, not a full live conversation
- keep provider secrets in the environment, not in checked-in config
