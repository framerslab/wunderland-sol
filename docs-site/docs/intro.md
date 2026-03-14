---
title: Welcome to Wunderland
slug: /
sidebar_position: 0
---

# Welcome to Wunderland

Wunderland is a library-first AI agent framework built on AgentOS. It combines a terminal-first operator experience, curated tools and skills, a capability discovery engine, speech runtime support, and multi-channel delivery in one stack.

## What You Get

- A root API built around `createWunderland()` and per-session turns.
- A CLI and TUI for setup, chat, diagnostics, skills, extensions, voice, and deployment.
- Curated AgentOS tools, registries, and skills with semantic discovery.
- Speech runtime support for STT, TTS, VAD, and telephony-adjacent voice flows.
- Presets for common agent shapes such as research assistants and code reviewers.

## Start Here

- [Installation](./getting-started/installation) for runtime requirements and install commands.
- [Quickstart](./getting-started/quickstart) for the fastest path from install to first turn.
- [Configuration](./getting-started/configuration) for `agent.config.json`, providers, tools, skills, and speech.
- [CLI Command Reference](./api/cli-reference) for the operator surface.
- [Creating Agents](./guides/creating-agents) for presets, manifests, and custom scaffolds.

## Pick A Path

### CLI / TUI

Use this path if you want a local operator console, setup wizard, diagnostics, and a ready-to-run agent process.

```bash
npm install -g wunderland
wunderland setup
wunderland start
wunderland chat
```

### Library Embedding

Use this path if Wunderland is becoming part of your own Node.js service, worker, or product backend.

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
});

const session = app.session();
const result = await session.sendText('Summarize the last three commits.');

console.log(result.text);
```

### Voice / Speech Runtime

Use this path if you want unified STT, TTS, provider switching, and runtime-backed voice tooling.

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
  },
});
```

Continue with the [Voice Runtime guide](./guides/voice-runtime) after the basic quickstart.
