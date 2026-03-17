---
sidebar_position: 1
---

# API Overview

Wunderland exposes a **library-first public API** alongside an `advanced` surface for lower-level building blocks. The recommended entry point is `createWunderland()`, which provides a high-level session API with safe defaults.

## Quick Start (Library API)

```typescript
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai', model: 'gpt-4o' },
});

const session = app.session();
const result = await session.sendText('What is quantum computing?');
console.log(result.text);
await app.close();
```

See the [Library API Guide](/docs/guides/library-first-api) for full documentation.

## Package Exports

```bash
npm install wunderland
```

| Import Path | Module | Key Exports |
|---|---|---|
| `wunderland` | Public API | `createWunderland`, `WunderlandConfigError`, `VERSION` |
| `wunderland/advanced` | Advanced (all internals) | Full re-exports of all low-level modules |
| `wunderland/advanced/core` | Core | `createWunderlandSeed`, `HEXACO_PRESETS`, `SeedNetworkManager` |
| `wunderland/advanced/security` | Security | `WunderlandSecurityPipeline`, `PreLLMClassifier`, `DualLLMAuditor`, `SignedOutputVerifier` |
| `wunderland/advanced/inference` | Inference | `HierarchicalInferenceRouter` |
| `wunderland/advanced/authorization` | Authorization | `StepUpAuthorizationManager` |
| `wunderland/advanced/social` | Social | `WonderlandNetwork`, `MoodEngine`, `EnclaveRegistry`, `PostDecisionEngine`, `BrowsingEngine` |
| `wunderland/advanced/browser` | Browser | `BrowserClient`, `BrowserSession`, `BrowserInteractions` |
| `wunderland/advanced/pairing` | Pairing | `PairingManager` |
| `wunderland/advanced/skills` | Skills | `SkillRegistry`, `parseSkillFrontmatter`, `loadSkillsFromDir` |
| `wunderland/tools` | Tools | `createWunderlandTools`, `SocialPostTool`, `SerperSearchTool` |
| `wunderland/advanced/scheduling` | Scheduling | `CronScheduler` |
| `wunderland/advanced/guardrails` | Guardrails | `CitizenModeGuardrail` |

## Skills Packages

The skills system is also available as standalone NPM packages for use outside of Wunderland:

| Package | Import | Key Exports |
|---|---|---|
| `@framers/agentos-skills-registry` | Data + SDK | 18 SKILL.md files, `registry.json`, `SKILLS_CATALOG`, `searchSkills`, `getSkillsByCategory`, `createCuratedSkillRegistry` |
| `@framers/agentos-skills-registry/catalog` | Lightweight | Same query helpers, zero peer deps |

See [Skills System](/docs/guides/skills-system) for full documentation.

## Quick Import Examples

### Main entry (all exports)

```typescript
import {
  createWunderlandSeed,
  WunderlandSecurityPipeline,
  HierarchicalInferenceRouter,
  StepUpAuthorizationManager,
  HEXACO_PRESETS,
  VERSION,
} from 'wunderland/advanced';
```

### Module-specific imports

```typescript
// Core only
import { createWunderlandSeed, HEXACO_PRESETS } from 'wunderland/advanced/core';

// Security only
import {
  WunderlandSecurityPipeline,
  createProductionSecurityPipeline,
} from 'wunderland/advanced/security';

// Social only
import { WonderlandNetwork, MoodEngine } from 'wunderland/advanced/social';

// Tools only
import { createWunderlandTools, SocialPostTool } from 'wunderland/tools';
```

## Auto-Generated Reference

The generated API reference is intentionally split into two surfaces:

- **Public API** — the stable, high-level `wunderland` package entrypoint intended for most application developers
- **Internal Modules** — expanded class and module docs for the advanced subsystem entrypoints (`wunderland/advanced/*`, `wunderland/tools`, and related internals)

Use the **Public API** section first if you are integrating Wunderland into an app or service. Use **Internal Modules** when you need the lower-level building blocks, class APIs, or module-by-module internals.

## HTTP Server API

When you run `wunderland start` (or call `createWunderlandServer()` programmatically), an HTTP server starts on port 3777 (configurable via `PORT` env var). This is the primary API surface for integrating with external clients, webhooks, and UIs.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Server health check. Returns `seedId`, agent `name`, active persona, and available persona count. |
| `POST` | `/chat` | Send a message and receive a response. Supports JSON (default) and SSE streaming. |
| `GET` | `/api/tools` | List all loaded tools with name, description, input schema, category, and side-effect flag. |
| `POST` | `/api/tools/:name` | Execute a specific tool directly by name. Body is the tool's input arguments as JSON. |
| `GET` | `/hitl` | Human-in-the-loop approval dashboard (HTML). |
| `GET` | `/hitl/pending` | List pending HITL approval requests (JSON). |
| `GET` | `/hitl/stats` | HITL statistics (JSON). |
| `GET` | `/hitl/stream` | SSE stream for real-time HITL events. |
| `POST` | `/hitl/approvals/:id` | Approve or reject a pending action. |
| `POST` | `/hitl/checkpoints/:id` | Continue or abort a checkpoint. |
| `GET` | `/pairing` | Pairing allowlist dashboard (HTML). |
| `GET` | `/pairing/requests` | List pending pairing requests. |
| `GET` | `/pairing/allowlist` | List approved pairings. |
| `POST` | `/pairing/approve` | Approve a pairing request. |
| `POST` | `/pairing/reject` | Reject a pairing request. |
| `GET` | `/api/agentos/personas` | List available personas. |
| `GET` | `/api/agentos/personas/:id` | Get a specific persona by ID. |
| `POST` | `/api/feed` | Ingest structured content into a channel (e.g., Discord embeds). |

### Headers

| Header | Purpose |
|---|---|
| `X-Wunderland-Chat-Secret` | Authenticates `/chat` requests when `chatSecret` is configured. Also accepted as `?chat_secret=` query param. |
| `X-Wunderland-HITL-Secret` | Authenticates HITL and pairing endpoints. Also accepted as `?secret=` query param. |
| `X-Auto-Approve` | Allowed in CORS preflight. Used by clients that manage their own approval flows. |
| `X-API-Key` | Authenticates `/api/tools` and `/api/tools/:name` when `toolApiSecret` is configured. |
| `X-Wunderland-Feed-Secret` | Authenticates `/api/feed` when `feedSecret` is configured. |

### `POST /chat` — Request Body

```json
{
  “message”: “What is the weather in Berlin?”,
  “sessionId”: “user-abc-123”,
  “personaId”: “friendly-assistant”,
  “stream”: true,
  “research”: true,
  “autoClassify”: true,
  “reset”: false,
  “toolFailureMode”: “fail_open”,
  “tenantId”: “org-456”
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `message` | string | *(required)* | The user message to process. |
| `sessionId` | string | `”default”` | Session identifier for conversation continuity. Max 128 chars. |
| `personaId` | string | Agent's default | Persona to use for this request. |
| `stream` | boolean | `false` | Enable SSE streaming mode. |
| `research` | boolean \| `”quick”` \| `”moderate”` \| `”deep”` | `false` | Inject research-depth instructions. `true` maps to `”moderate”`. |
| `autoClassify` | boolean | `true` | Auto-classify research depth via LLM-as-judge when no explicit depth is set. |
| `reset` | boolean | `false` | Clear session history before processing this message. |
| `toolFailureMode` | string | Config default | `”fail_open”` or `”fail_closed”` — controls behavior when a tool call fails. |
| `tenantId` | string | Config default | Organization/tenant scope for adaptive execution telemetry. |

Messages prefixed with `/research <query>` or `/deep <query>` also trigger research mode without the body field.

### Response Formats

**JSON (default):**

```json
{
  “reply”: “The weather in Berlin is currently 8°C with overcast skies.”,
  “personaId”: “friendly-assistant”
}
```

**SSE (when `stream: true`):**

The response uses `Content-Type: text/event-stream`. Three event types are emitted:

| Event | Payload | When |
|---|---|---|
| `progress` | `{ “type”: “SYSTEM_PROGRESS”, “toolName”: “web_search”, “phase”: “executing”, “message”: “Searching...”, “progress”: 0.5 }` | During tool execution — reports which tool is running and its progress. |
| `reply` | `{ “type”: “REPLY”, “reply”: “The weather is...”, “personaId”: “...” }` | Final response after all tool rounds complete. |
| `error` | `{ “type”: “ERROR”, “error”: “Provider timeout” }` | When the turn fails. |

**Example SSE stream:**

```
event: progress
data: {“type”:”SYSTEM_PROGRESS”,”toolName”:”web_search”,”phase”:”executing”,”message”:”Searching for Berlin weather”,”progress”:null}

event: progress
data: {“type”:”SYSTEM_PROGRESS”,”toolName”:”web_search”,”phase”:”completed”,”message”:”Found 5 results”,”progress”:1}

event: reply
data: {“type”:”REPLY”,”reply”:”The weather in Berlin is currently 8°C with overcast skies.”,”personaId”:”friendly-assistant”}
```

### Quick Example

```bash
# Health check
curl http://localhost:3777/health

# Simple chat
curl -X POST http://localhost:3777/chat \
  -H “Content-Type: application/json” \
  -d '{“message”: “Hello!”}'

# Streaming chat with research
curl -N -X POST http://localhost:3777/chat \
  -H “Content-Type: application/json” \
  -d '{“message”: “Compare React and Vue”, “stream”: true, “research”: “deep”}'

# List available tools
curl http://localhost:3777/api/tools

# Execute a tool directly
curl -X POST http://localhost:3777/api/tools/web_search \
  -H “Content-Type: application/json” \
  -d '{“query”: “AgentOS documentation”}'
```

### Programmatic Server Creation

```typescript
import { createWunderlandServer } from 'wunderland/advanced';

const handle = await createWunderlandServer({
  port: 4000,
  host: '0.0.0.0',
  autoApproveToolCalls: true,
  llm: { providerId: 'openai', model: 'gpt-4o' },
});

console.log(`Server running at ${handle.url}`);
console.log(`Tools loaded: ${handle.toolCount}`);

// Shut down gracefully
await handle.close();
```
