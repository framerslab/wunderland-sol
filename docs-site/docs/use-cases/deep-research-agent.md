---
title: Deep Research Agent
sidebar_position: 2
---

# Deep Research Agent

> Build an agent that researches topics deeply — searching the web, reading pages, and producing structured reports.

---

## Overview

A deep research agent combines:
- **Web search** for discovering sources
- **Web browser** for extracting page content
- **Summarization** for distilling findings
- **RAG memory** for accumulating knowledge across sessions

---

## Quick Start

```bash
# Scaffold with the research preset
wunderland init research-copilot --preset research-assistant
cd research-copilot

# Add the tools
wunderland extensions add web-search web-browser

# Start chatting
wunderland chat
```

Then ask:

```
You: Research the current state of WebAssembly adoption in 2024-2025.
     Include major frameworks, browser support, and performance benchmarks.
     Produce a structured report with sources.
```

---

## Library Setup

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai', model: 'gpt-4o' },
  preset: 'research-assistant',
  extensions: {
    tools: ['web-search', 'web-browser'],
  },
  skills: ['web-search', 'summarize', 'coding-agent'],
  discovery: {
    recallProfile: 'aggressive', // surface more tools when relevant
  },
  approvals: {
    mode: 'deny-side-effects', // read-only by default
  },
});

const session = app.session();
const result = await session.sendText(
  'Research quantum computing breakthroughs in the last 6 months. ' +
  'Focus on error correction advances. Cite all sources.'
);

console.log(result.text);
```

---

## Recommended Configuration

### agent.config.json

```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o",
  "personalityPreset": "analytical",
  "extensions": {
    "tools": ["web-search", "web-browser"]
  },
  "skills": ["web-search", "summarize"],
  "rag": {
    "enabled": true,
    "mode": "hybrid",
    "autoIngest": true
  },
  "security": {
    "preLlmClassifier": true,
    "dualLlmAuditor": true,
    "outputSigning": false,
    "riskThreshold": 0.7
  }
}
```

### Why These Settings

- **gpt-4o** — Best reasoning for synthesizing multiple sources
- **analytical personality** — Fact-focused, thorough, less creative embellishment
- **hybrid RAG** — Stores research findings for follow-up sessions
- **autoIngest** — Automatically extracts and stores key facts
- **deny-side-effects** — Read-only tools (search, browse) work freely; writing requires approval

---

## Research Workflow

### Single-Shot Research

```
You: Research [topic]. Produce a structured report with:
     1. Executive summary
     2. Key findings (with source citations)
     3. Data points and statistics
     4. Open questions / areas for further research
```

### Multi-Turn Deep Dive

```
You: Search for recent advances in solid-state batteries.
Agent: [searches, returns initial findings]

You: Read the top 3 most relevant articles in detail.
Agent: [browses pages, extracts content]

You: Now synthesize everything into a technical brief.
Agent: [produces structured report with citations]

You: What are the main disagreements between researchers?
Agent: [analyzes sources for conflicting claims]
```

### Comparative Analysis

```
You: Compare React, Vue, and Svelte for a new enterprise dashboard project.
     Consider: performance, ecosystem, hiring pool, and long-term maintenance.
     Search for recent benchmarks and industry surveys.
```

---

## Extension Stack

| Extension | Purpose |
|-----------|---------|
| `web-search` | Multi-provider search (Serper, SerpAPI, Brave) |
| `web-browser` | Page content extraction, screenshot, structured data |
| `news-search` | NewsAPI integration for current events |
| `image-search` | Find relevant images and diagrams |

### Environment Variables

```bash
# Required: at least one search provider
SERPER_API_KEY=...        # serper.dev (recommended)
# or
SERPAPI_API_KEY=...       # serpapi.com
# or
BRAVE_API_KEY=...         # search.brave.com

# Optional: for current news
NEWSAPI_API_KEY=...       # newsapi.org
```

---

## Scaling Research

### RAG Memory for Ongoing Research

With RAG enabled, your agent remembers findings across sessions:

```
# Session 1
You: Research the EU AI Act and its implications for startups.

# Session 2 (days later)
You: What did we learn about the EU AI Act last time?
Agent: [recalls from RAG memory] Based on our previous research...

You: Has anything changed since then? Search for updates.
Agent: [searches for new information, compares with stored knowledge]
```

### Scheduled Research

Combine with [scheduling](/docs/guides/scheduling) for automated research:

```json
{
  "name": "weekly-industry-scan",
  "steps": [
    {
      "id": "search",
      "action": "web-search",
      "params": { "query": "{{topic}} news this week" }
    },
    {
      "id": "analyze",
      "action": "chat",
      "params": {
        "prompt": "Analyze these findings. Highlight anything that differs from what we knew before."
      }
    },
    {
      "id": "report",
      "action": "channel-post",
      "params": { "channel": "slack", "target": "#research" }
    }
  ]
}
```

---

## Guardrails

For research agents, keep these defaults:

- **Read-only by default** — Search and browse don't modify anything
- **Require approval for posting** — If the agent publishes findings, require human review
- **Verify sources** — The analytical personality preset encourages citation
- **Rate limit searches** — Avoid hitting API quotas in deep research sessions

---

## Next Steps

- **[Autonomous Web Agent](/docs/use-cases/autonomous-web-agent)** — Simpler research agent pattern
- **[Extensions Guide](/docs/guides/extensions)** — Add more tool capabilities
- **[Scheduling Guide](/docs/guides/scheduling)** — Automate research workflows
- **[Voice Concierge](/docs/use-cases/voice-concierge)** — Add voice to your research agent
