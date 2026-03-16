---
sidebar_position: 20
---

# HTTP Streaming API

The default `/chat` endpoint returns a single JSON response after the agent finishes thinking. That works fine for simple queries. But when an agent runs a 9-minute deep research pipeline or chains four tool calls back-to-back, the client stares at a spinner with no feedback.

Streaming mode fixes this. Send `"stream": true` in the request body and the response switches from JSON to Server-Sent Events (SSE). Progress events arrive in real-time as the agent works.

## Quick Start

```bash
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Research the current state of quantum computing", "stream": true}'
```

The `-N` flag disables curl's output buffering so events print as they arrive.

Output:

```
event: progress
data: {"type":"SYSTEM_PROGRESS","toolName":"deep_research","phase":"decomposing","message":"Decomposing query into sub-questions (iter 1/3, 0 findings)","progress":0.1}

event: progress
data: {"type":"SYSTEM_PROGRESS","toolName":"deep_research","phase":"searching","message":"Searching sources \"quantum error correction 2026\" (iter 1/3, 4 findings, 3 sources)","progress":0.33}

event: progress
data: {"type":"SYSTEM_PROGRESS","toolName":"deep_research","phase":"extracting","message":"Extracting content from sources (iter 2/3, 8 findings, 7 sources)","progress":0.5}

event: progress
data: {"type":"SYSTEM_PROGRESS","toolName":"deep_research","phase":"synthesizing","message":"Synthesizing report (iter 3/3, 14 findings, 12 sources)","progress":0.9}

event: reply
data: {"type":"REPLY","reply":"## Current State of Quantum Computing\n\n...","personaId":"seed_my_agent"}
```

## Request Format

```http
POST /chat
Content-Type: application/json
```

```json
{
  "message": "your prompt here",
  "stream": true,
  "sessionId": "optional-session-id"
}
```

The only addition is `"stream": true`. All other fields from the standard `/chat` endpoint work identically: `sessionId`, `tenantId`, `reset`, `research`, `toolFailureMode`.

## Response Format

When `stream` is `true`, the response uses `Content-Type: text/event-stream` with `Cache-Control: no-cache` and `Connection: keep-alive`.

### SSE Event Types

Three event types are emitted:

#### `progress` -- Tool Execution Updates

Fired whenever a tool reports progress. Most common during research and browser automation.

```
event: progress
data: {"type":"SYSTEM_PROGRESS","toolName":"deep_research","phase":"searching","message":"Searching sources \"CRISPR safety\"","progress":0.4}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"SYSTEM_PROGRESS"` | Always this value for progress events |
| `toolName` | `string` | Name of the tool reporting progress |
| `phase` | `string` | Current phase (tool-specific) |
| `message` | `string` | Human-readable status message |
| `progress` | `number \| null` | 0-1 completion fraction, or null if indeterminate |

Research phases: `decomposing`, `searching`, `extracting`, `analyzing_gaps`, `synthesizing`, `complete`.

#### `reply` -- Final Agent Response

Sent once when the agent finishes.

```
event: reply
data: {"type":"REPLY","reply":"The answer is...","personaId":"seed_my_agent"}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"REPLY"` | Always this value for the final reply |
| `reply` | `string` | The agent's text response |
| `personaId` | `string` | Which persona generated the response |

#### `error` -- Turn Failure

Sent if the LLM or a tool call fails.

```
event: error
data: {"type":"ERROR","error":"Rate limit exceeded. Retry after 30 seconds."}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"ERROR"` | Always this value for errors |
| `error` | `string` | Error message |

After an `error` event, the stream ends. No `reply` event follows.

## Non-Streaming Mode (Default)

When `stream` is omitted or `false`, the endpoint returns a single JSON response:

```json
{
  "reply": "The answer is...",
  "personaId": "seed_my_agent"
}
```

No SSE, no progress events. The HTTP connection stays open until the agent is done.

## Auto-Approve Header

By default, tools with side effects (file writes, shell commands, etc.) require human approval through the HITL UI. In streaming mode, waiting for approval blocks the entire stream.

The `X-Auto-Approve: true` header bypasses approval for side-effect tools:

```bash
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -H "X-Auto-Approve: true" \
  -d '{"message": "Create a summary.txt file with the key findings", "stream": true}'
```

Security constraints:
- Only honored for **loopback requests** (localhost) or **authenticated requests** (valid `x-wunderland-chat-secret` header)
- Remote requests without a chat secret are ignored -- tools still require HITL approval
- Read-only tools (web search, file read, etc.) are always auto-approved regardless of this header

## JavaScript Client Example

```javascript
const response = await fetch('http://localhost:3777/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Research the latest advances in fusion energy',
    stream: true,
    sessionId: 'user-42',
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // Parse SSE frames from the buffer
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer

  let eventType = '';
  for (const line of lines) {
    if (line.startsWith('event: ')) {
      eventType = line.slice(7);
    } else if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      if (eventType === 'progress') {
        console.log(`[${data.phase}] ${data.message}`);
        if (data.progress !== null) {
          updateProgressBar(data.progress);
        }
      } else if (eventType === 'reply') {
        console.log('Agent:', data.reply);
      } else if (eventType === 'error') {
        console.error('Error:', data.error);
      }
    }
  }
}
```

## curl Examples

### Simple streaming chat

```bash
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "stream": true}'
```

### Streaming with deep research

```bash
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze the economic impact of AI on the labor market", "stream": true, "research": "deep"}'
```

### Authenticated streaming with auto-approve

```bash
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -H "x-wunderland-chat-secret: my-secret" \
  -H "X-Auto-Approve: true" \
  -d '{"message": "Write a report to output.md", "stream": true}'
```

### Streaming with session context

```bash
# First message
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Research quantum computing breakthroughs in 2026", "stream": true, "sessionId": "research-1"}'

# Follow-up in same session
curl -N -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Now compare those to classical computing limits", "stream": true, "sessionId": "research-1"}'
```

## Related

- [Chat Server](./chat-server.md) -- Full HTTP API reference (non-streaming)
- [Deep Research](./deep-research.md) -- Research pipeline and query classification
- [Security Pipeline](./security-pipeline.md) -- HITL approval system
