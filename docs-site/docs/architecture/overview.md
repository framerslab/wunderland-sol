---
title: Architecture Overview
sidebar_position: 1
---

# Architecture Overview

Wunderland is a product/runtime layer built on top of AgentOS.

## Stack Layers

1. AgentOS provides the base runtime, providers, tools, extensions, memory, and speech primitives.
2. Wunderland adds presets, CLI/TUI operations, capability discovery, channel orchestration, and operator workflows.
3. Registries provide curated skills, tools, channels, and provider manifests.

## Operational Shape

- Library-first API for embedding in services
- CLI and TUI for local operators
- Curated extensions and skills for fast capability assembly
- Approval and safety controls for side-effectful tools
- Speech runtime support for STT/TTS/VAD-capable agent flows

## Main Runtime Flow

```text
User input
  -> config + preset resolution
  -> skill / extension loading
  -> capability discovery
  -> LLM turn + tool calling
  -> approvals / guardrails
  -> response stream
```

## Where To Go Next

- [AgentOS Integration](./agentos-integration)
- [Library-First API](../guides/library-first-api)
- [Capability Discovery](../guides/capability-discovery)
