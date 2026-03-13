# Cognitive Memory System

Wunderland agents powered by AgentOS include an optional **Cognitive Memory System** — a personality-modulated, decay-aware memory architecture grounded in cognitive science.

Unlike flat key-value memory or simple RAG retrieval, this system models memory as biological systems do: encoding strength varies with personality and emotion, memories decay over time, retrieval is biased by mood, and working memory has finite capacity.

## Key Features

- **Personality-driven encoding** — HEXACO traits modulate what an agent pays attention to and how strongly it encodes (high openness → stronger encoding of novel content)
- **Ebbinghaus forgetting curve** — Memories naturally decay over time, but retrieval strengthens them via spaced repetition
- **Baddeley's working memory** — Slot-based capacity limits (7 plus/minus 2, personality-modulated) with activation-level tracking
- **Mood-congruent recall** — Content matching the agent's current emotional state (PAD model) is retrieved more strongly
- **Spreading activation** — Associated memories activate each other through an in-memory or Neo4j-backed knowledge graph
- **Prospective memory** — Goal/intention-triggered reminders (time-based, event-based, or context-based)
- **Background consolidation** — Periodic pipeline prunes weak traces, merges episodic clusters into semantic schemas, resolves conflicts

## Memory Types

| Type | Description | Example |
|------|-------------|---------|
| **Episodic** | Events and experiences | "The user asked about dark mode on Tuesday" |
| **Semantic** | Facts and knowledge | "The user prefers TypeScript" |
| **Procedural** | Learned tool usage patterns | "Use the search tool before answering factual questions" |
| **Prospective** | Future intentions and reminders | "Remind the user about the meeting at 3pm" |

## Enabling Cognitive Memory

Cognitive memory is opt-in. Add it to your agent's persona definition:

```typescript
// In your persona config
const persona = {
  // ... other fields
  cognitiveMemoryConfig: {
    featureDetectionStrategy: 'keyword', // or 'llm' or 'hybrid'
    workingMemoryCapacity: 7,
    encoding: {
      baseStrength: 0.6,
      stabilityMs: 86_400_000, // 24 hours
    },
  },
};
```

Or enable it programmatically:

```typescript
import { CognitiveMemoryManager } from '@agentos/core';

const memory = new CognitiveMemoryManager();
await memory.initialize({
  vectorStore,
  embeddingManager,
  knowledgeGraph,
  workingMemory,
  agentId: 'my-agent',
  traits: { openness: 0.7, conscientiousness: 0.6 },
  moodProvider: () => currentMood,
  featureDetectionStrategy: 'keyword',
});

// Encode after user messages
const trace = await memory.encode('User prefers dark mode', currentMood, 'neutral');

// Retrieve before building prompts
const result = await memory.retrieve('user preferences', currentMood);

// Assemble into prompt context (token-budgeted)
const context = await memory.assembleForPrompt('current query', 500, currentMood);
```

## How It Works

### Encoding Pipeline

1. User message arrives
2. **Content feature detection** extracts novelty, emotion, procedure, social signals (via keywords, LLM, or hybrid)
3. **HEXACO personality weights** determine attention allocation (e.g., high openness → more attention to novelty)
4. **Yerkes-Dodson arousal curve** modulates encoding quality (moderate arousal is optimal)
5. **Flashbulb detection** — extreme emotional events get 2x strength, 5x stability
6. **Mood-congruent encoding** — content matching current mood valence is encoded more strongly
7. Trace is stored in vector store + knowledge graph + working memory

### Retrieval Pipeline

1. Query is embedded
2. Vector similarity search finds candidates
3. **Six-signal composite scoring**: strength (25%), similarity (35%), recency (10%), emotional congruence (15%), graph activation (10%), importance (5%)
4. **Spreading activation** through memory graph finds associated memories
5. **Spaced repetition** updates — each retrieval strengthens the trace
6. Top results enter working memory slots

### Token-Budgeted Prompt Assembly

Memory context is assembled within a configurable token budget:

| Section | Budget % | Contents |
|---------|----------|----------|
| Working Memory | 15% | Active scratchpad state |
| Semantic Recall | 45% | Personality-biased vector search results |
| Recent Episodic | 25% | Emotionally-weighted recent experiences |
| Prospective / Graph / Observation | 15% | Reminders, associations, observer notes |

Unused allocations overflow into semantic recall automatically.

## Cognitive Science Foundations

| Model | Application |
|-------|-------------|
| Atkinson-Shiffrin | Sensory → working memory → long-term memory pipeline |
| Baddeley | Slot-based working memory with capacity limits |
| Tulving | Episodic, semantic, procedural, prospective memory types |
| Ebbinghaus | Exponential strength decay: S(t) = S0 * e^(-t/stability) |
| Yerkes-Dodson | Encoding peaks at moderate arousal |
| Brown & Kulik | Flashbulb memories for high-emotion events |
| Anderson ACT-R | Spreading activation in associative memory graph |
| Hebbian learning | Co-retrieval strengthens memory associations |

## Advanced: Batch 2 Modules

These activate automatically when their config is provided:

- **Memory Observer** — Monitors conversation token accumulation, extracts personality-biased observation notes via LLM
- **Memory Reflector** — Consolidates observations into long-term traces (5-40x compression)
- **Memory Graph** — Associative network with 8 edge types, spreading activation, Hebbian learning
- **Consolidation Pipeline** — Hourly background process: decay sweep, co-activation replay, schema integration, conflict resolution, spaced repetition

For full technical details, see the [AgentOS Cognitive Memory documentation](https://github.com/wunderland-sh/voice-chat-assistant/blob/master/packages/agentos/docs/COGNITIVE_MEMORY.md).
