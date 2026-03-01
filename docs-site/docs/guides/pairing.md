---
sidebar_position: 35
title: Pairing & Allowlists
description: Control who can interact with your agent using pairing codes and sender allowlists.
---

# Pairing & Allowlists

Pairing is an authentication gate for unknown channel senders. When someone messages your agent for the first time, the bot responds with a short pairing code. A bot owner or admin approves the code, which permanently adds that sender to an allowlist. All future messages from that sender bypass the gate.

## When to Use Pairing

Pairing is designed for **private or enterprise deployments** where you want explicit control over who can interact with the bot:

- Internal company bots (Slack, Teams, Discord private servers)
- Personal assistants you want to lock to specific contacts
- Client-facing bots deployed to a known audience
- Any scenario where unrestricted public access is not acceptable

**Do not enable pairing for public community servers** (such as an open Discord where every member should be able to use the bot). In those cases, disable it entirely so users are not prompted for a code.

## Configuration

Pairing is configured in `agent.config.json` under the `pairing` key:

```json
{
  "pairing": {
    "enabled": true,
    "groupTrigger": "!pair",
    "pendingTtlMs": 3600000,
    "maxPending": 3,
    "codeLength": 8
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `enabled` | `true` | Enable or disable the pairing gate entirely |
| `groupTrigger` | `"!pair"` | The phrase a user must send in a group chat to request a pairing code. Set to `"off"` to disable group chat pairing |
| `pendingTtlMs` | `3600000` | How long a pending pairing code is valid, in milliseconds (default: 1 hour) |
| `maxPending` | `3` | Maximum number of pending (unresolved) pairing requests per channel |
| `codeLength` | `8` | Length of generated pairing codes |

### Disabling Pairing

To turn off pairing completely and allow all senders through:

```json
{
  "pairing": {
    "enabled": false
  }
}
```

## Pairing Flow

### Direct Messages (DMs)

When an unknown user sends a DM to the bot:

1. The bot automatically replies with a pairing code (e.g., `ABC12345`).
2. The user is told to share the code with the bot owner for approval.
3. The admin approves the code via the pairing UI or API.
4. The user is added to the allowlist and their original message is processed.

### Group Chats

In group chats, the bot does not automatically respond to every unknown message (to avoid spamming the channel). Instead:

1. The unknown user sends the configured `groupTrigger` phrase (default: `!pair`).
2. The bot replies with a pairing code.
3. The admin approves the code via the pairing UI or API.
4. The user is allowlisted for that channel.

To prevent pairing in group chats entirely, set `groupTrigger` to `"off"`.

## Approving Codes

### Via the Pairing UI

The pairing dashboard is available while the agent is running:

```
http://localhost:{port}/pairing
```

The UI lists all pending pairing requests. Click **Approve** or **Reject** next to each code.

### Via the API

You can approve or reject codes programmatically using the pairing API. All management endpoints require the `hitl-secret` query parameter for authentication.

#### List Pending Requests

```
GET /pairing/requests?secret=<hitl-secret>
```

Returns all pending (unapproved) pairing requests.

**Example response:**

```json
[
  {
    "code": "ABC12345",
    "channel": "discord",
    "senderId": "user-789",
    "requestedAt": "2025-09-01T14:23:00Z",
    "expiresAt": "2025-09-01T15:23:00Z"
  }
]
```

#### Approve a Code

```
POST /pairing/approve?secret=<hitl-secret>
Content-Type: application/json

{
  "channel": "discord",
  "code": "ABC12345"
}
```

Returns `200 OK` on success. The sender is immediately added to the allowlist.

#### Reject a Code

```
POST /pairing/reject?secret=<hitl-secret>
Content-Type: application/json

{
  "channel": "discord",
  "code": "ABC12345"
}
```

Returns `200 OK` on success. The pending request is removed and the sender is not allowlisted.

#### List Allowlisted Senders

```
GET /pairing/allowlist?secret=<hitl-secret>
```

Returns all senders that have been approved for a given channel.

## Storage

Pairing data is persisted as JSON files in the agent's workspace directory. Two files are maintained per channel:

| File | Contents |
|------|----------|
| `{workspace}/pairing/{channel}-pairing.json` | Pending pairing requests (codes awaiting approval) |
| `{workspace}/pairing/{channel}-allowFrom.json` | Approved senders (the allowlist) |

For example, a Discord deployment with workspace `~/.wunderland/my-agent` would store data at:

```
~/.wunderland/my-agent/pairing/discord-pairing.json
~/.wunderland/my-agent/pairing/discord-allowFrom.json
```

You can manually edit the `allowFrom.json` file to pre-populate the allowlist without going through the pairing flow, or to remove a sender's access.

## API Reference Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/pairing` | None | Pairing dashboard UI |
| `GET` | `/pairing/requests` | `?secret=` | List pending requests |
| `GET` | `/pairing/allowlist` | `?secret=` | List allowlisted senders |
| `POST` | `/pairing/approve` | `?secret=` | Approve a pairing code |
| `POST` | `/pairing/reject` | `?secret=` | Reject a pairing code |
