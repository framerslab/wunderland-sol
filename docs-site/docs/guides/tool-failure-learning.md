---
sidebar_position: 18
---

# Tool Failure Learning

Agents make mistakes. A browser call gets blocked by a bot detector. An API call fails because the key is missing. A scrape returns empty HTML because the site requires JavaScript.

Tool failure learning means the agent remembers what went wrong and avoids repeating it. When a tool fails, the `ToolFailureLearner` analyzes the error, generates a human-readable lesson, and stores it in the agent's RAG memory. Next time a similar situation arises, the lesson surfaces automatically — before the agent makes the same mistake.

No configuration needed. This runs automatically whenever RAG is active.

## How It Works

```
Tool execution fails
  ↓
ToolFailureLearner analyzes the error message and tool name
  ↓
Matches against 6 known failure patterns
  ↓
Generates a structured lesson (what failed, why, what to do instead)
  ↓
MemoryAutoIngestPipeline stores the lesson in the vector store
  ↓
Future RAG queries surface the lesson as context
```

The agent doesn't retry blindly. It learns a specific alternative and uses it on the next attempt.

## Failure Patterns

The learner detects six categories of failure:

| Pattern | Trigger Signals | Example Lesson |
|---------|----------------|----------------|
| **Anti-bot detection** | "captcha", "access denied", "bot detected", 403 on known sites | "Use `stealth_navigate` instead of `browser_navigate` for amazon.com" |
| **Empty results** | Tool returns empty string, null body, or zero-length array | "amazon.com returns empty content with standard browser — use stealth or web_search" |
| **API key missing** | "unauthorized", "api key", "authentication", 401 status | "SERPER_API_KEY not set — use DuckDuckGo web_search as fallback" |
| **Timeout** | "timeout", "ETIMEDOUT", "ESOCKETTIMEDOUT" | "linkedin.com consistently times out — use web_search for LinkedIn content" |
| **Rate limit** | "rate limit", "too many requests", 429 status | "OpenAI API rate limited — wait before retrying or use Ollama fallback" |
| **Ollama model missing** | "model not found", "pull model" | "Model `llama3.3` not installed — run `ollama pull llama3.3` or use `qwen2.5:7b`" |

## Deduplication

The learner tracks which lessons have been stored during the current session. If `browser_navigate` fails on amazon.com three times in a row, only the first failure generates a lesson. Subsequent identical failures are silently skipped.

Deduplication is keyed on `toolName + domain + failurePattern`. Different failure patterns on the same domain still produce separate lessons.

## Example: Browser Blocked on eBay

**First encounter:**

```
You: Find the price of a PS5 on eBay

Agent: [calls browser_navigate → ebay.com]
       ✗ Error: page returned empty content (anti-bot detection)

       [ToolFailureLearner stores lesson:
        "browser_navigate returns empty content on ebay.com due to
         anti-bot detection. Use stealth_navigate for eBay URLs."]

       Let me try a different approach.
       [calls stealth_navigate → ebay.com]
       ✓ The PS5 Digital Edition is listed from $399 on eBay.
```

**Second encounter (days later):**

```
You: What's a used Nintendo Switch going for on eBay?

Agent: [RAG surfaces lesson: "Use stealth_navigate for eBay URLs"]
       [calls stealth_navigate → ebay.com directly]
       ✓ Used Nintendo Switch listings range from $180 to $230.
```

The agent skipped `browser_navigate` entirely because the stored lesson told it to go straight to stealth.

## What Gets Stored

Each lesson is a plain-text document ingested into the vector store with metadata:

```
Source: tool-failure-learning
Tool: browser_navigate
Domain: ebay.com
Pattern: anti-bot
Timestamp: 2026-03-15T10:23:00Z

Lesson: browser_navigate failed on ebay.com — the site returned empty
content due to anti-bot detection. For future requests to ebay.com,
use stealth_navigate which applies anti-detection measures
(puppeteer-extra stealth plugin).
```

The lesson is embedded and indexed like any other RAG document. Standard similarity search surfaces it when the agent encounters related queries.

## Requirements

Tool failure learning activates automatically when these conditions are met:

- **RAG is enabled** — `rag.enabled: true` in `agent.config.json` (or a knowledge base directory exists)
- **A vector store is initialized** — in-memory or persistent HNSW

If RAG is disabled, tool failures still appear in the conversation as error messages, but no lessons are persisted for future sessions.

## Relationship to Other Systems

- **HyDE retrieval** — Lessons stored by the failure learner benefit from HyDE. When a user asks "scrape eBay for prices," HyDE generates a hypothetical answer that semantically matches the stored lesson about eBay anti-bot detection.
- **Stealth browser** — The most common lesson learned is "use `stealth_navigate` instead of `browser_navigate`." The failure learner is how agents discover the stealth browser extension organically.
- **Memory system** — Lessons are stored through the same `MemoryAutoIngestPipeline` used for conversation memories, knowledge base documents, and user preference learning.
