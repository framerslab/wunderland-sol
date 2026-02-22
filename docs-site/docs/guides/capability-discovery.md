---
sidebar_position: 19
title: Capability Discovery
description: How Wunderland agents discover and use capabilities dynamically
---

# Capability Discovery

Wunderland agents can access 23+ tools, 18 skills, 20+ extensions, and 28 messaging channels. Loading all of those definitions into every LLM call wastes tokens and degrades inference quality. The Capability Discovery Engine replaces static loading with on-demand semantic search so agents only see the capabilities relevant to the current conversation.

## How It Works

When a user message arrives, the engine runs a three-stage pipeline:

```
"search the web for AI news"
        |
   Semantic Search ── embed query, find nearest capabilities
        |
   Graph Re-ranking ── boost related capabilities (co-occurrence, shared skills)
        |
   Tiered Context   ── allocate token budget across three detail levels
        |
   ~1,800 tokens of relevant capability context (down from ~20k)
```

**Semantic search** finds candidates by embedding similarity. **Graph re-ranking** adjusts scores using relationship data -- capabilities that share dependencies or belong to the same skill group get boosted together. **Tiered context budgeting** controls how much detail each capability gets:

| Tier | Detail Level | ~Tokens | When Used |
|------|-------------|---------|-----------|
| **Full** | Complete schema, examples, error handling | ~400 | Top 1-3 most relevant matches |
| **Standard** | Parameters, return type, usage hints | ~150 | Next 3-5 matches |
| **Brief** | Name and one-line description | ~40 | Remaining matches |

The agent can promote a brief-tier capability to full detail mid-conversation by calling the `discover_capabilities` meta-tool.

## For Agent Creators

### Configuring Discovery in Presets

Agent presets already declare `suggestedSkills` and `suggestedExtensions`. These feed directly into the discovery engine's relationship graph, giving those capabilities a baseline score boost:

```json
{
  "name": "research-assistant",
  "suggestedSkills": ["web-search", "summarize", "deep-research"],
  "suggestedExtensions": ["content-extraction", "news-search"],
  "discovery": {
    "enabled": true,
    "tokenBudget": 2500,
    "graphWeight": 0.4
  }
}
```

When an agent is scaffolded from this preset, the discovery engine pre-indexes the suggested capabilities and gives them a graph-weight advantage. They still need to score above the relevance threshold to appear in context -- they are not force-included.

### Discovery in agent.config.json

For agents created without a preset, configure discovery directly:

```json
{
  "skills": ["web-search", "github", "coding-agent"],
  "extensions": ["browser-automation", "credential-vault"],
  "discovery": {
    "enabled": true,
    "tokenBudget": 2000,
    "maxResults": 15,
    "tierThresholds": {
      "full": 0.85,
      "standard": 0.65
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `tokenBudget` | `2000` | Max tokens for capability context per turn |
| `maxResults` | `15` | Max capabilities to include |
| `tierThresholds.full` | `0.85` | Similarity score threshold for full-tier |
| `tierThresholds.standard` | `0.65` | Similarity score threshold for standard-tier |
| `graphWeight` | `0.3` | Influence of relationship graph on ranking (0-1) |
| `metaToolEnabled` | `true` | Allow the agent to call `discover_capabilities` mid-conversation |

Set `"enabled": false` to fall back to static capability loading for agents with a small, fixed toolset.

## Custom Capabilities

Define custom capabilities as `CAPABILITY.yaml` files. The engine scans two directories:

- **User-global**: `~/.wunderland/capabilities/`
- **Project-local**: `./.wunderland/capabilities/`

Project-local capabilities override user-global ones with the same name.

```yaml
name: internal-api-lookup
version: "1.0.0"
description: Query the internal REST API for customer and order data.
category: business-tools
tags:
  - api
  - internal
  - customer

parameters:
  type: object
  properties:
    endpoint:
      type: string
      description: API endpoint path (e.g., /customers, /orders)
    query:
      type: object
      description: Query parameters as key-value pairs
  required:
    - endpoint

relationships:
  - credential-vault
  - web-browser

examples:
  - endpoint: "/customers"
    query: { "email": "user@example.com" }
    description: Find a customer by email
```

The `relationships` field tells the graph re-ranker which other capabilities tend to be useful alongside this one. When `internal-api-lookup` scores high, `credential-vault` and `web-browser` get a boost too.

## CLI Integration

The `wunderland chat` command enables discovery automatically when the agent has more than 10 registered capabilities. You can control this explicitly:

```bash
# Force discovery on
wunderland chat --discovery

# Force discovery off (static loading)
wunderland chat --no-discovery

# Set a custom token budget
wunderland chat --discovery --discovery-budget 3000
```

During a chat session, the engine logs discovery decisions at the `debug` level:

```
[discovery] Query: "search the web for AI news"
[discovery] Matched 11 capabilities in 14ms (warm cache)
[discovery] Tiers: 2 full, 3 standard, 6 brief → 1,640 tokens
```

Enable debug logging with `--verbose` or `LOG_LEVEL=debug` to see these.

## Performance

Benchmarked on a full Wunderland agent catalog (45 capabilities):

| Metric | Value |
|--------|-------|
| Cold discovery latency | ~120ms |
| Warm discovery latency | ~15ms |
| Token reduction | 89% (~20k to ~1.8k) |
| Top-3 precision | 0.91 |

The warm path uses a per-session embedding cache. The index builds once during agent startup and persists for the session lifetime. For agents with fewer than 10 capabilities, the overhead of discovery exceeds the token savings -- the engine disables itself automatically in that case.

## Related Guides

- [Skills System](./skills-system.md) -- curated skills that feed into discovery
- [Extensions](./extensions.md) -- extension ecosystem and registry
- [Channels](./channels.md) -- messaging channel system
- [Guardrails](./guardrails.md) -- security controls for capability execution
- [Inference Routing](./inference-routing.md) -- how discovered capabilities interact with model selection
