---
sidebar_position: 4
title: Agent Config Reference
description: Complete reference for the agent.config.json configuration file.
---

# Agent Config Reference

Complete reference for all fields in `agent.config.json`.

---

## Identity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `seedId` | string | Yes | Unique agent identifier. Must be globally unique across your deployment. Convention: `"seed_<name>"`. |
| `displayName` | string | Yes | Human-readable name shown in UI and logs. |
| `bio` | string | No | Short description of the agent's purpose or persona. |
| `systemPrompt` | string | No | System prompt prepended to every LLM conversation. Defines role, tone, and behavioral constraints. |

```json
{
  "seedId": "seed_my_agent",
  "displayName": "My Agent",
  "bio": "A helpful assistant for the Wunderland community.",
  "systemPrompt": "You are a helpful assistant. Be concise and friendly."
}
```

---

## Personality

Models the agent's personality using the [HEXACO model](https://hexaco.org/). All values are floats in the range `0.0`–`1.0`. Default for all fields is `0.5`.

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `personality.honesty` | number | `0.5` | 0.0–1.0 | Sincerity, fairness, and avoidance of deception. Higher values yield more transparent, direct responses. |
| `personality.emotionality` | number | `0.5` | 0.0–1.0 | Sensitivity and emotional expressiveness. Higher values produce more empathetic, emotionally aware replies. |
| `personality.extraversion` | number | `0.5` | 0.0–1.0 | Sociability and enthusiasm. Higher values yield more energetic, talkative responses. |
| `personality.agreeableness` | number | `0.5` | 0.0–1.0 | Patience and tolerance. Higher values reduce confrontational behavior. |
| `personality.conscientiousness` | number | `0.5` | 0.0–1.0 | Organization and diligence. Higher values produce more methodical, thorough responses. |
| `personality.openness` | number | `0.5` | 0.0–1.0 | Creativity and curiosity. Higher values yield more imaginative, exploratory responses. |

```json
{
  "personality": {
    "honesty": 0.8,
    "emotionality": 0.4,
    "extraversion": 0.6,
    "agreeableness": 0.7,
    "conscientiousness": 0.9,
    "openness": 0.5
  }
}
```

### Personality Toggles

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `personalityEnabled` | boolean | `true` | Enable or disable the HEXACO personality system entirely. When `false`, the agent uses a raw system prompt with no personality-derived behavioral guidelines, mood engine, or trait evolution. |
| `personalityPreset` | string | — | HEXACO preset key. One of `"HELPFUL_ASSISTANT"`, `"CREATIVE_THINKER"`, `"ANALYTICAL_RESEARCHER"`, `"EMPATHETIC_COUNSELOR"`, `"DECISIVE_EXECUTOR"`, or `"custom"`. When set, overrides individual `personality.*` values with the preset's trait profile. |
| `personalityEvolution` | boolean | `false` | Enable personality evolution. When `true`, the agent's HEXACO traits slowly drift based on interactions using the `TraitEvolution` engine (bounded by ±0.15 max drift from baseline). |

```json
{
  "personalityEnabled": true,
  "personalityPreset": "HELPFUL_ASSISTANT",
  "personalityEvolution": false
}
```

When `personalityEnabled` is `false`:
- System prompt builder skips all HEXACO-derived behavioral guidelines
- MoodEngine is not initialized
- TraitEvolution is not initialized
- The agent uses its raw `systemPrompt` only

When `personalityEvolution` is `true`:
- A `TraitEvolution` instance tracks interaction patterns
- Traits drift at a rate of 0.003 per evolution tick, bounded to ±0.15 from baseline
- Evolution begins after a minimum of 15 interactions
- Evolution state persists across restarts

---

## LLM Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `llmProvider` | string | `"openai"` | LLM backend. One of `"openai"`, `"ollama"`, `"anthropic"`. |
| `llmModel` | string | varies by provider | Model ID passed directly to the provider. |

**Model ID examples by provider:**

| Provider | Example Model IDs |
|----------|------------------|
| `openai` | `"gpt-4o"`, `"gpt-4o-mini"`, `"o1"` |
| `ollama` | `"qwen3:8b"`, `"llama3.1:8b"`, `"mistral:7b"` |
| `anthropic` | `"claude-sonnet-4-20250514"`, `"claude-opus-4-20250514"` |

```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o"
}
```

---

## Security

Top-level shorthand fields control the overall security posture. A `security` object provides fine-grained control.

### Shorthand Fields

| Field | Type | Default | Options | Description |
|-------|------|---------|---------|-------------|
| `securityTier` | string | `"balanced"` | `"permissive"`, `"balanced"`, `"strict"` | Preset that configures multiple security defaults at once. |
| `executionMode` | string | `"human-all"` | `"autonomous"`, `"human-dangerous"`, `"human-all"` | Controls when human approval is required before tool execution. |
| `permissionSet` | string | `"default"` | `"autonomous"`, `"default"`, `"locked"` | Determines which actions the agent is allowed to perform. |
| `toolAccessProfile` | string | `"standard"` | `"unrestricted"`, `"standard"`, `"restricted"` | Controls the breadth of tools available to the agent. |

**`executionMode` behavior:**

| Value | Behavior |
|-------|----------|
| `"autonomous"` | Agent executes all tools without human confirmation. |
| `"human-dangerous"` | Human approval required only for high-risk tool calls. |
| `"human-all"` | Human approval required before every tool call. |

### `security` Object

```json
"security": {
  "tier": "balanced",
  "preLLMClassifier": true,
  "dualLLMAudit": false,
  "outputSigning": true,
  "riskThreshold": 0.7,
  "wrapToolOutputs": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `security.tier` | string | `"balanced"` | Mirrors the top-level `securityTier`. One of `"permissive"`, `"balanced"`, `"strict"`. |
| `security.preLLMClassifier` | boolean | `true` | Run a classifier on user input before it reaches the LLM to detect and block policy-violating prompts. |
| `security.dualLLMAudit` | boolean | `false` | Send LLM output to a second model for audit before returning to the user. Increases latency. |
| `security.outputSigning` | boolean | `true` | Cryptographically sign agent outputs for tamper detection in audit logs. |
| `security.riskThreshold` | number | `0.7` | Float `0.0`–`1.0`. Inputs scored above this threshold by the classifier are blocked. Lower = stricter. |
| `security.wrapToolOutputs` | boolean | `true` | Wrap raw tool outputs in a structured envelope before passing back to the LLM, preventing prompt injection via tool results. |

---

## Discovery

Semantic tool selection. When enabled, the agent uses vector embeddings to select the most relevant subset of tools for each query, rather than sending all tools to the LLM.

```json
"discovery": {
  "enabled": false,
  "embeddingProvider": "ollama",
  "embeddingModel": "nomic-embed-text",
  "tokenBudget": 4096,
  "maxResults": 15,
  "graphWeight": 0.3,
  "metaToolEnabled": true
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `discovery.enabled` | boolean | `false` | Enable semantic tool discovery. When `false`, all registered tools are sent to the LLM on every request. |
| `discovery.embeddingProvider` | string | `"ollama"` | Provider for the embedding model. One of `"ollama"`, `"openai"`. |
| `discovery.embeddingModel` | string | `"nomic-embed-text"` | Model used to generate vector embeddings for tool descriptions and user queries. |
| `discovery.tokenBudget` | number | `4096` | Maximum tokens to spend on tool definitions sent to the LLM per request. |
| `discovery.maxResults` | number | `15` | Maximum number of tools returned by the semantic search. |
| `discovery.graphWeight` | number | `0.3` | Weight `0.0`–`1.0` given to graph-based tool co-occurrence scores vs. pure semantic similarity. |
| `discovery.metaToolEnabled` | boolean | `true` | Expose a meta-tool that lets the LLM explicitly request additional tools by name if the initial selection was insufficient. |

**When to enable discovery:**

- `enabled: false` — recommended when you have fewer than ~50 tools. All tools are sent directly; no embedding overhead.
- `enabled: true` — recommended for large tool registries (50+ tools) to stay within LLM context limits.

:::warning Embedding model requirement
Discovery requires a **dedicated embedding model**, not a chat model. Models like `qwen3`, `llama3`, and `mistral` are chat models and will not produce usable vector embeddings. Use a model explicitly designed for embeddings, such as `nomic-embed-text` (Ollama) or `text-embedding-3-small` (OpenAI).
:::

---

## Pairing

Controls agent pairing — a mechanism for linking users or sessions together via a shared code.

```json
"pairing": {
  "enabled": false,
  "groupTrigger": "!pair",
  "pendingTtlMs": 3600000,
  "maxPending": 3,
  "codeLength": 8
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `pairing.enabled` | boolean | `false` | Enable the pairing feature. |
| `pairing.groupTrigger` | string | `"!pair"` | Chat command that initiates a pairing request. |
| `pairing.pendingTtlMs` | number | `3600000` | Time-to-live in milliseconds for a pending pairing code before it expires. Default is 1 hour. |
| `pairing.maxPending` | number | `3` | Maximum number of concurrent pending pairing requests per user. |
| `pairing.codeLength` | number | `8` | Length of the generated pairing code (alphanumeric characters). |

---

## Extensions

Declares named extension bundles to load. Extensions add tools, voice processors, and productivity integrations.

```json
"extensions": {
  "tools": ["web-search", "weather", "giphy"],
  "voice": [],
  "productivity": []
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `extensions.tools` | string[] | `[]` | Tool extension bundles to load. Each string is a registered extension ID. |
| `extensions.voice` | string[] | `[]` | Voice processing extensions (e.g., STT/TTS pipelines). |
| `extensions.productivity` | string[] | `[]` | Productivity integrations (e.g., calendar, task management). |

---

## Channels

Declares which messaging platforms the agent listens on.

```json
"channels": ["discord", "telegram", "slack"]
```

| Type | Value | Options |
|------|-------|---------|
| string[] | — | `"discord"`, `"telegram"`, `"slack"` |

Each value corresponds to a channel adapter that must be configured with the appropriate credentials in your environment or secrets store.

---

## Observability

OpenTelemetry (OTel) integration for tracing and log export.

```json
"observability": {
  "otel": {
    "enabled": false,
    "exportLogs": false
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `observability.otel.enabled` | boolean | `false` | Enable OpenTelemetry tracing. Exports spans to the configured OTel collector endpoint. |
| `observability.otel.exportLogs` | boolean | `false` | Also export structured logs via OTel. Requires `enabled: true`. |

Configure the OTel collector endpoint via the standard `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable.

---

## Examples

### Minimal Config

The minimum viable configuration to start an agent.

```json
{
  "seedId": "seed_my_bot",
  "displayName": "My Bot",
  "llmProvider": "openai",
  "llmModel": "gpt-4o",
  "channels": ["discord"]
}
```

### Full Config

A complete configuration demonstrating all fields.

```json
{
  "seedId": "seed_rabbithole_agent",
  "displayName": "Wunderbot",
  "bio": "AI assistant for the Rabbit Hole Inc community.",
  "systemPrompt": "You are Wunderbot, a helpful and friendly assistant for the Wunderland Discord community. Be concise, accurate, and enthusiastic.",

  "personality": {
    "honesty": 0.85,
    "emotionality": 0.5,
    "extraversion": 0.7,
    "agreeableness": 0.75,
    "conscientiousness": 0.8,
    "openness": 0.65
  },

  "llmProvider": "openai",
  "llmModel": "gpt-4o",

  "securityTier": "balanced",
  "executionMode": "human-dangerous",
  "permissionSet": "default",
  "toolAccessProfile": "standard",

  "security": {
    "tier": "balanced",
    "preLLMClassifier": true,
    "dualLLMAudit": false,
    "outputSigning": true,
    "riskThreshold": 0.7,
    "wrapToolOutputs": true
  },

  "discovery": {
    "enabled": false,
    "embeddingProvider": "ollama",
    "embeddingModel": "nomic-embed-text",
    "tokenBudget": 4096,
    "maxResults": 15,
    "graphWeight": 0.3,
    "metaToolEnabled": true
  },

  "pairing": {
    "enabled": false,
    "groupTrigger": "!pair",
    "pendingTtlMs": 3600000,
    "maxPending": 3,
    "codeLength": 8
  },

  "extensions": {
    "tools": ["web-search", "weather"],
    "voice": [],
    "productivity": []
  },

  "channels": ["discord"],

  "observability": {
    "otel": {
      "enabled": false,
      "exportLogs": false
    }
  }
}
```

### Local LLM Config (Ollama)

```json
{
  "seedId": "seed_local_bot",
  "displayName": "Local Bot",
  "llmProvider": "ollama",
  "llmModel": "qwen3:8b",
  "channels": ["discord"],
  "discovery": {
    "enabled": true,
    "embeddingProvider": "ollama",
    "embeddingModel": "nomic-embed-text",
    "tokenBudget": 2048,
    "maxResults": 10
  }
}
```

### Strict Security Config

```json
{
  "seedId": "seed_secure_bot",
  "displayName": "Secure Bot",
  "llmProvider": "anthropic",
  "llmModel": "claude-sonnet-4-20250514",
  "securityTier": "strict",
  "executionMode": "human-all",
  "permissionSet": "locked",
  "toolAccessProfile": "restricted",
  "security": {
    "tier": "strict",
    "preLLMClassifier": true,
    "dualLLMAudit": true,
    "outputSigning": true,
    "riskThreshold": 0.4,
    "wrapToolOutputs": true
  },
  "channels": ["discord"]
}
```
