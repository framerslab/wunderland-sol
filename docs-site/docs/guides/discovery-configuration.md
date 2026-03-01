---
sidebar_position: 21
title: Discovery Configuration
description: Configure semantic tool discovery with embedding models for intelligent tool selection.
---

# Discovery Configuration

The [Capability Discovery](./capability-discovery.md) guide covers how semantic discovery works. This guide covers how to configure it for your deployment.

## Why Discovery Matters

With fewer than 30 tools, sending all definitions to the LLM on every request is fine. Once you cross ~50 tools, it becomes a problem:

- **Token waste**: Full tool definitions for 50+ tools consume 15,000–30,000+ tokens per request
- **Quality degradation**: LLMs perform worse when the context is crowded with irrelevant definitions
- **Latency**: More input tokens means slower first-token response

Discovery solves this by embedding your user's message and finding the most semantically relevant tools. Only the matched tools get sent to the LLM context.

## When to Enable

| Tool Count | Recommendation |
|-----------|----------------|
| < 30 | Disable — direct list is fine |
| 30–50 | Optional — minor benefits |
| 50–100 | Recommended — meaningful token savings |
| 100+ | Required — LLM performance degrades significantly |

## Embedding Model Requirements

Discovery requires a model that produces vector embeddings — a fixed-size numerical representation of text. This is a fundamentally different operation from text generation.

**Chat and instruct models do NOT work for embeddings.** Models like `qwen3:8b`, `llama3`, and `mistral` generate text tokens, not embedding vectors. Passing them as the `embeddingModel` will result in an error.

You must configure a dedicated embedding model.

### Ollama Embedding Models

| Model | Dimensions | Size | Install |
|-------|-----------|------|---------|
| `nomic-embed-text` | 768 | 274 MB | `ollama pull nomic-embed-text` |
| `mxbai-embed-large` | 1024 | 670 MB | `ollama pull mxbai-embed-large` |
| `all-minilm` | 384 | 45 MB | `ollama pull all-minilm` |

`nomic-embed-text` is the recommended default for most local setups — good quality at a modest size.

### OpenAI Embedding Models

| Model | Dimensions | Cost |
|-------|-----------|------|
| `text-embedding-3-small` | 1536 | $0.02 / 1M tokens |
| `text-embedding-3-large` | 3072 | $0.13 / 1M tokens |

OpenAI embeddings require an `OPENAI_API_KEY` environment variable.

## Configuration Examples

### Disabled (Direct Tool List)

Use this when you have fewer than 30 tools and want the simplest possible configuration.

```json
{
  "discovery": {
    "enabled": false
  }
}
```

### Ollama Embeddings

The chat model and embedding model are configured separately. You can use `qwen3:8b` for chat while `nomic-embed-text` handles embeddings — they serve different purposes and do not need to match.

```json
{
  "llmProvider": "ollama",
  "llmModel": "qwen3:8b",
  "discovery": {
    "enabled": true,
    "embeddingProvider": "ollama",
    "embeddingModel": "nomic-embed-text",
    "tokenBudget": 4096,
    "maxResults": 15,
    "graphWeight": 0.3
  }
}
```

### OpenAI Embeddings

```json
{
  "discovery": {
    "enabled": true,
    "embeddingProvider": "openai",
    "embeddingModel": "text-embedding-3-small"
  }
}
```

Requires `OPENAI_API_KEY` to be set in your environment.

### Mixed Providers

You can use different providers for chat and embeddings. A common setup is Ollama for local chat with OpenAI embeddings for higher-quality semantic matching:

```json
{
  "llmProvider": "ollama",
  "llmModel": "qwen3:8b",
  "discovery": {
    "enabled": true,
    "embeddingProvider": "openai",
    "embeddingModel": "text-embedding-3-small"
  }
}
```

This keeps inference costs low while getting strong embedding quality from OpenAI.

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable or disable semantic discovery |
| `embeddingProvider` | string | inherits `llmProvider` | `"ollama"` or `"openai"` |
| `embeddingModel` | string | provider default | Embedding model ID |
| `tokenBudget` | number | `4096` | Max tokens allocated to tool definitions per request |
| `maxResults` | number | `15` | Max number of tools included per request |
| `tierThresholds` | object | `{ tier1: 0.4, tier2: 0.2 }` | Similarity score cutoffs for each tier |
| `graphWeight` | number | `0.3` | Weight applied to graph re-ranking scores |
| `metaToolEnabled` | boolean | `true` | Allow the LLM to request additional tools mid-conversation |

## Three-Tier Context Model

Discovery organizes tools into three tiers before building the LLM context:

- **Tier 0**: Always included. These are core tools the agent needs in every conversation, such as `sendMessage`. You designate Tier 0 tools explicitly in your tool definitions.
- **Tier 1**: Semantically matched to the current user message. These tools scored above `tierThresholds.tier1` in similarity and are included with full detail.
- **Tier 2**: Relevant but below the Tier 1 threshold. Available to the system but excluded from the active context. The meta-tool lets the LLM pull from this pool if needed.

## Best Practices

**Write descriptive tool descriptions.** Discovery matches the user's message against tool descriptions using embedding similarity. Vague descriptions like `"Does stuff with files"` will match poorly. Specific descriptions like `"Read the contents of a file at a given path and return them as a string"` match much better.

**Designate Tier 0 tools deliberately.** Only tools the agent genuinely needs in every interaction should be Tier 0. Overloading Tier 0 defeats the purpose of discovery.

**Keep `metaToolEnabled: true`.** The meta-tool allows the LLM to request additional tools it realizes it needs partway through a conversation. Disabling it can cause the agent to fail on multi-step tasks where later steps require tools not matched at the start.

**`nomic-embed-text` is the best local option for most use cases.** It balances quality and size well. Only switch to `mxbai-embed-large` if you observe meaningful matching quality problems and have the VRAM to spare.

**Tool embeddings are cached at startup.** The system embeds all tool descriptions once when the agent initializes. Only the user's message gets embedded on each request, which keeps per-request latency low.

**Monitor discovery quality.** If an expected tool is not being selected for a query, check whether the tool description is specific enough and whether the query similarity score is close to your `tier1` threshold. Lowering the threshold slightly or improving the description usually resolves it.

## Troubleshooting

**"Model X does not support embeddings"**

The model configured as `embeddingModel` is a chat or instruct model, not an embedding model. Switch to a dedicated embedding model such as `nomic-embed-text` (Ollama) or `text-embedding-3-small` (OpenAI). Your chat model (`llmModel`) is unaffected.

**Discovery is enabled but the right tools are not being selected**

Check two things: first, are the tool descriptions specific and informative? Vague descriptions produce weak embeddings. Second, is the similarity threshold too strict? Try lowering `tierThresholds.tier1` from `0.4` to `0.3` and re-testing.

**Too many irrelevant tools are being selected**

Raise `tierThresholds.tier1` (e.g., from `0.4` to `0.5`) to require a closer match, or lower `maxResults` to cap the total number of tools included. Both reduce noise at the cost of potentially missing edge-case tools.
