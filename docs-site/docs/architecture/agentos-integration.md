---
title: AgentOS Integration
sidebar_position: 2
---

# AgentOS Integration

Wunderland should be thought of as an AgentOS-powered distribution, not a separate agent runtime.

## What AgentOS Owns

- Model/provider abstraction
- tool contracts
- extension kinds and registry wiring
- memory and cognitive systems
- speech runtime and provider interfaces
- guardrails and structured runtime primitives

## What Wunderland Adds

- the root `createWunderland()` facade
- CLI/TUI operator workflows
- presets and templates
- capability discovery defaults
- curated runtime assembly for practical deployment

## Speech Runtime Relationship

Speech now rides on AgentOS-owned contracts and runtime sessions. Wunderland exposes that through:

- extension selection: `voice: ['speech-runtime']`
- CLI operator commands under `wunderland voice`
- catalog-driven provider/status views in the TUI and CLI

That means STT/TTS/VAD provider changes happen behind one high-level runtime contract instead of bespoke app-specific code paths.
