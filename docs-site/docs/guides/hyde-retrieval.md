---
sidebar_position: 15
---

# HyDE Retrieval (Hypothetical Document Embedding)

Standard RAG retrieval embeds your question and searches for similar vectors. The problem: questions and answers live in different semantic neighborhoods. "How do I configure voice?" doesn't look anything like the stored chunk "Set `tts` to `elevenlabs` in your agent.config.json."

HyDE closes that gap. Instead of embedding the raw question, the agent first asks the LLM to generate a hypothetical answer, then embeds *that*. The hypothetical answer — even if imperfect — is semantically closer to the real stored answer than the original question ever was.

## How It Works

```
User query
  ↓
LLM generates a hypothetical answer (a plausible paragraph)
  ↓
Hypothetical answer is embedded into a vector
  ↓
Vector store search finds real documents similar to that vector
  ↓
Real documents returned as context for the final response
```

The key insight: embedding a *statement* retrieves better matches than embedding a *question*. This comes from Gao et al. 2023 ("Precise Zero-Shot Dense Retrieval without Relevance Labels") and refined by Lei et al. 2025.

## Adaptive Thresholding

HyDE uses adaptive similarity thresholds to avoid returning nothing:

1. Start at similarity threshold `0.7`
2. Search the vector store
3. If no results, step down by `0.1` and retry
4. Continue until results are found or the minimum threshold (`0.3`) is reached

This means high-confidence matches surface first, but the agent won't come back empty-handed on niche queries.

## Configuration

Enable HyDE in your `agent.config.json` under the `rag` section:

```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o",
  "rag": {
    "enabled": true,
    "hyde": {
      "enabled": true,
      "initialThreshold": 0.7,
      "thresholdStep": 0.1,
      "minThreshold": 0.3,
      "adaptiveThreshold": true,
      "maxHypothesisTokens": 256,
      "fullAnswerGranularity": true
    }
  }
}
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `true` | Toggle HyDE on/off |
| `initialThreshold` | `0.7` | Starting similarity score for vector search |
| `thresholdStep` | `0.1` | How much to lower the threshold on each retry |
| `minThreshold` | `0.3` | Lowest similarity threshold before giving up |
| `adaptiveThreshold` | `true` | Whether to step the threshold down automatically |
| `maxHypothesisTokens` | `200` | Token budget guidance for the hypothetical answer prompt |
| `fullAnswerGranularity` | `true` | Prefer full prose answers instead of terse keyword expansions |
| `hypothesisSystemPrompt` | Built-in default | Advanced override for the HyDE hypothesis prompt |

## Performance

HyDE adds one extra LLM call before retrieval:

| Provider | Latency Overhead | Cost per Query |
|----------|-----------------|----------------|
| Ollama (local, 3B model) | ~200–400 ms | Free |
| OpenAI (`gpt-4o-mini`) | ~300–500 ms | ~$0.001 |
| Anthropic (`claude-haiku`) | ~300–500 ms | ~$0.001 |

For most use cases, the retrieval quality improvement far outweighs the small latency hit.

## When to Disable HyDE

HyDE works best for factual, how-to, and troubleshooting queries — cases where the answer exists verbatim in your knowledge base. Consider disabling it when:

- **Concept-focused questions** — "What is the philosophy behind immutability?" doesn't benefit from a hypothetical answer because the real content is abstract, not procedural.
- **Very low latency requirements** — If sub-100ms retrieval matters more than recall quality.
- **Small knowledge bases** — With fewer than ~50 chunks, brute-force similarity search works fine without HyDE.
- **Keyword-heavy queries** — Exact term matching (e.g., error codes, UUIDs) doesn't benefit from semantic hypothesis generation.

Disable per-agent:

```json
{
  "rag": {
    "enabled": true,
    "hyde": {
      "enabled": false
    }
  }
}
```

## How It Fits Together

HyDE operates within the existing RAG pipeline. When enabled:

1. **MemoryAutoIngestPipeline** ingests documents into the vector store (unchanged)
2. **RAG query arrives** — HyDE intercepts before the vector search step
3. **Hypothesis generated** — small LLM call produces a plausible answer
4. **Vector search** runs against the hypothesis embedding instead of the raw query
5. **Results returned** to the main LLM as context for the final answer

If HyDE is disabled, the pipeline falls back to standard query embedding — no other behavior changes.

## HyDE and Observational Memory

The observational memory system (MemoryObserver + MemoryReflector) produces long-term memory traces that are encoded into the same vector store used by the RAG pipeline. HyDE improves retrieval of these traces significantly.

### Why It Matters

Observation notes and reflection traces are written as declarative statements: "User prefers Docker Compose for deployments" or "The team decided to postpone the migration until Q3." When a user later asks "how should we deploy?", raw query embedding may not match these statements well — the question and the stored answer occupy different semantic neighborhoods.

HyDE bridges this gap. It generates a hypothetical answer like "Deployments should use Docker Compose as configured in the project..." and embeds *that*. The hypothetical answer is semantically closer to the stored observation trace, producing higher-quality retrieval.

### The Pipeline

```
User asks "what did we decide about the migration?"
  ↓
HyDE generates: "The team decided to postpone the migration until Q3
                  due to resource constraints and dependency on..."
  ↓
Hypothetical answer is embedded
  ↓
Vector search finds the reflection trace:
  "Team postponed migration to Q3. Resource constraints cited."
  ↓
Trace returned as context for the final response
```

### Adaptive Thresholds for Sparse Observations

Early in a conversation, the agent may have few observation traces stored. HyDE's adaptive thresholding (stepping from 0.7 down to 0.3) prevents empty results in these cases — the system will surface partial matches from observations rather than returning nothing.

As the conversation progresses and the reflector produces more traces, the vector store becomes denser, and high-threshold matches become more common.
