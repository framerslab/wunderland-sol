---
title: Installation
sidebar_position: 1
---

# Installation

## Requirements

- Node.js 20+
- npm 10+ or pnpm 9+
- At least one configured LLM provider

Optional but common:

- `OPENAI_API_KEY` for OpenAI-backed chat or speech
- `ELEVENLABS_API_KEY` for ElevenLabs TTS / voice cloning
- Ollama for local model execution
- Local speech binaries if you plan to use offline STT/TTS adapters

## Install The CLI

```bash
npm install -g wunderland
```

Then confirm the command is available:

```bash
wunderland --help
```

## Install As A Library

```bash
npm install wunderland
```

If you are building directly on AgentOS extension types too:

```bash
npm install wunderland @framers/agentos
```

## First-Time Environment

Set the API key for your chosen LLM provider:

```bash
# OpenAI (most common starting point)
export OPENAI_API_KEY=sk-...

# Or Anthropic (Claude)
export ANTHROPIC_API_KEY=sk-ant-...

# Or Google Gemini
export GEMINI_API_KEY=AIza...

# Or OpenRouter (200+ models, single key)
export OPENROUTER_API_KEY=sk-or-...

# Or Ollama (local, no key needed)
# Just install and run: ollama serve
```

If you want the speech runtime with ElevenLabs:

```bash
export ELEVENLABS_API_KEY=your_key_here
```

For the full provider setup guide, see [LLM Provider Setup](../guides/llm-providers).

## Recommended First Run

```bash
wunderland setup
```

The setup wizard walks through:

- LLM provider and model selection
- config file location
- preset selection
- tool and extension choices
- speech / telephony provider configuration when relevant

Next: [Quickstart](./quickstart)
