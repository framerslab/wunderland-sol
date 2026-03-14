---
title: Agent Config Reference
sidebar_position: 4
---

# Agent Config Reference

This is the fast reference for the config areas most teams touch first.

## High-Signal Keys

| Key | Purpose |
| --- | --- |
| `name` | Human-readable agent name |
| `preset` | Pre-configured baseline for tools, skills, and personality |
| `llmProvider` / `llmModel` | Default model selection |
| `securityTier` | Operational safety baseline |
| `toolCalling` | Tool exposure and name-normalization behavior |
| `channels` | Messaging / social adapters |
| `extensions` | Curated runtime packs, including speech |
| `skills` | Prompt modules loaded into the system prompt |

## Example

```json
{
  "name": "research-assistant",
  "preset": "research-assistant",
  "llmProvider": "openai",
  "llmModel": "gpt-4.1-mini",
  "securityTier": "balanced",
  "toolCalling": {
    "strictToolNames": false
  },
  "extensions": {
    "tools": ["web-search", "web-browser"],
    "voice": ["speech-runtime"]
  },
  "skills": ["web-search", "summarize"]
}
```

## When To Use Presets

Use presets when you want:

- a coherent initial personality
- suggested tools and skills
- less hand-written configuration

Override preset defaults with explicit `skills`, `extensions`, or runtime options when you need tighter control.

## Speech Notes

If the agent needs speech features, prefer the runtime-backed voice stack:

```json
{
  "extensions": {
    "voice": ["speech-runtime"]
  }
}
```

Then configure provider secrets in the environment, not hard-coded in the config file.
