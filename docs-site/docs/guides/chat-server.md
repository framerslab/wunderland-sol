---
sidebar_position: 43
---

# Chat Server (HTTP API)

Wunderland ships a built-in HTTP server that exposes your agent as a REST API. Start it, send a POST request, get a response. No SDK required.

## Quick Start

### 1. Create an agent

```bash
wunderland init my-agent
cd my-agent
```

:::warning
You must `cd` into the agent directory before running `wunderland start`. The server reads `agent.config.json` from the current working directory.
:::

### 2. Start the server

```bash
wunderland start
```

Output:

```
  Wunderland v1.x.x
  Agent: my-agent
  Provider: ollama (llama3.1:8b)

  Health: http://localhost:3777/health
  Chat:   POST http://localhost:3777/chat
  HITL:   http://localhost:3777/hitl
```

### 3. Send a message

```bash
curl -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a file with the two richest men in history"}'
```

The agent processes your message, runs any tools it needs (file creation, web search, etc.), and returns the result.

## POST /chat

The main endpoint. Send a JSON body, get the agent's response.

### Request

```http
POST /chat
Content-Type: application/json
```

**Required fields:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | The prompt to send to the agent |

**Optional fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `sessionId` | `string` | `"default"` | Conversation session ID. Messages within the same session share context (up to 200 messages). |
| `tenantId` | `string` | — | Tenant identifier for multi-tenant deployments |
| `toolFailureMode` | `string` | — | How to handle tool failures (`"continue"`, `"abort"`, etc.) |
| `reset` | `boolean` | `false` | Clear the session history before processing this message |

### Examples

**Simple message:**

```json
{
  "message": "What is the capital of France?"
}
```

**With session tracking:**

```json
{
  "message": "Now tell me about its history",
  "sessionId": "user-42"
}
```

Messages with the same `sessionId` share conversation history. The agent remembers previous messages in the session, so follow-up questions work naturally.

**Reset a session:**

```json
{
  "message": "Let's start fresh",
  "sessionId": "user-42",
  "reset": true
}
```

### Response

```json
{
  "reply": "The capital of France is Paris.",
  "toolCalls": 0,
  "fallback": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `reply` | `string` | The agent's text response |
| `toolCalls` | `number` | Number of tool calls executed during this turn |
| `fallback` | `boolean` | Whether a fallback provider was used |

### Error Responses

| Status | Body | Cause |
|--------|------|-------|
| `400` | `{"error": "Missing \"message\" in JSON body."}` | Empty or missing `message` field |
| `401` | `{"error": "Unauthorized"}` | Invalid or missing chat secret (when configured) |
| `500` | `{"error": "..."}` | LLM or tool execution failure |

## GET /chat

Returns usage instructions for the endpoint:

```bash
curl http://localhost:3777/chat
```

```json
{
  "endpoint": "POST /chat",
  "usage": "Send a JSON body with { \"message\": \"your prompt\" }",
  "example": "curl -X POST http://localhost:3777/chat -H \"Content-Type: application/json\" -d '{\"message\":\"hello\"}'"
}
```

## Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | `GET` | Health check (returns `{"status":"ok"}`) |
| `/chat` | `POST` | Send a message to the agent |
| `/hitl` | `GET` | Human-in-the-loop approval web UI |
| `/hitl/pending` | `GET` | List pending approval requests |
| `/hitl/stream` | `GET` | SSE stream of approval events |
| `/pairing` | `GET` | Agent pairing interface |

## Server Options

```bash
wunderland start --port 4000 --host 127.0.0.1
```

| Flag | Default | Description |
|------|---------|-------------|
| `--port <number>` | `3777` | Server port |
| `--host <address>` | `0.0.0.0` | Bind address |
| `--no-webchat` | — | Disable the built-in WebChat UI |
| `--detach` | — | Run in the background |
| `--auto-approve-tools` | — | Skip tool approval prompts (autonomous mode) |

## Authentication

By default, the chat endpoint is open (no auth required). To secure it, set a chat secret:

**Environment variable:**

```bash
export WUNDERLAND_CHAT_SECRET=my-secret-token
wunderland start
```

**Or in `agent.config.json`:**

```json
{
  "chat": {
    "secret": "my-secret-token"
  }
}
```

Then include the secret in requests:

```bash
# Via header
curl -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -H "x-wunderland-chat-secret: my-secret-token" \
  -d '{"message": "hello"}'

# Or via query parameter
curl -X POST "http://localhost:3777/chat?secret=my-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

## Using from Code

### JavaScript / TypeScript

```typescript
const response = await fetch('http://localhost:3777/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello, what can you do?' }),
});

const data = await response.json();
console.log(data.reply);
```

### Python

```python
import requests

response = requests.post('http://localhost:3777/chat', json={
    'message': 'Hello, what can you do?'
})

data = response.json()
print(data['reply'])
```

## Session Management

The server maintains conversation history per `sessionId` in memory.

- Default session ID is `"default"` if not specified
- Sessions are capped at 200 messages (oldest messages are trimmed, system prompt is preserved)
- Sessions are lost when the server restarts
- Send `"reset": true` to clear a session

For persistent conversation history, use the terminal chat (`wunderland chat`) or connect a channel adapter (Discord, Telegram, etc.).
