---
sidebar_position: 2
---

# CLI Command Reference

Complete reference for the `wunderland` command-line interface.

## Interactive TUI Dashboard

When you run `wunderland` with no arguments in a TTY terminal, it launches the **interactive TUI dashboard** — a keyboard-driven terminal UI with:

- Cyberpunk-styled frame with cyan/lavender borders
- Animated scan line intro and banner typewriter effect
- Agent status panels (config, API keys)
- Quick action menu with arrow-key navigation and scroll support
- Responsive layout that adapts to terminal width (stacks panels on narrow screens)
- Keyboard shortcuts for direct access to commands

```bash
# Launch the TUI dashboard
wunderland
```

**Navigation:**

| Key | Action |
|-----|--------|
| `↑`/`↓` or `j`/`k` | Navigate actions |
| `Enter` | Select action |
| `1` | Setup onboarding |
| `2` | Open chat |
| `3` | Start server |
| `4`-`7` | Skills, Extensions, Models, RAG |
| `d` | Doctor |
| `s` | Status |
| `v` | Voice |
| `h` | Help |
| `r` | Refresh |
| `q` / `Esc` | Quit |

## Commands

### `wunderland setup`

Interactive onboarding wizard that guides you through initial configuration.

```bash
wunderland setup
```

The setup wizard:

- Detects available LLM providers (Ollama local, OpenAI, Anthropic, OpenRouter)
- Reads system specs for model recommendations
- Accepts bulk `.env` paste for API key import
- Creates the agent seed configuration
- Stores everything at `~/.wunderland/`

**Options:**

| Flag | Description |
|------|-------------|
| `--provider <name>` | Skip provider selection (e.g., `ollama`, `openai`, `anthropic`) |
| `--model <name>` | Skip model selection (e.g., `llama3.1:8b`, `gpt-4o`) |
| `--non-interactive` | Use defaults for all prompts (combine with `--provider` and `--model`) |

---

### `wunderland init <name>`

Scaffold a new Wunderland agent project in a directory.

```bash
wunderland init my-agent
```

Creates a project structure:

```
my-agent/
  seed.config.ts       # Agent seed configuration
  extensions/          # Custom extension directory
  .env.example         # Example environment variables
  package.json         # Node.js package manifest
  tsconfig.json        # TypeScript configuration
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<name>` | Project directory name (also used as default agent name) |

**Options:**

| Flag | Description |
|------|-------------|
| `--template <name>` | Project template (`default`, `minimal`, `full`) |
| `--no-git` | Skip git initialization |

---

### `wunderland start`

Start the local Wunderland HTTP server and agent runtime.

```bash
wunderland start
```

Launches the agent on port **3777** by default. The server provides:

- REST API at `http://localhost:3777/api/`
- WebSocket gateway for real-time communication
- WebChat interface at `http://localhost:3777/chat`

**Options:**

| Flag | Description |
|------|-------------|
| `--port <number>` | Override the server port (default: `3777`) |
| `--host <address>` | Bind address (default: `0.0.0.0`) |
| `--no-webchat` | Disable the built-in WebChat interface |
| `--detach` | Run in the background (daemonize) |

---

### `wunderland chat`

Open an interactive terminal conversation with your agent.

```bash
wunderland chat
```

Starts a REPL-style chat session. Type messages and receive streamed responses directly in the terminal.

**Options:**

| Flag | Description |
|------|-------------|
| `--no-stream` | Disable streaming (wait for complete response) |
| `--system <prompt>` | Override the system prompt for this session |
| `--model <name>` | Override the primary model for this session |

**Special commands within the REPL:**

| Command | Description |
|---------|-------------|
| `/clear` | Clear the conversation history |
| `/system <prompt>` | Change the system prompt |
| `/model <name>` | Switch the model |
| `/tools` | List available tools |
| `/exit` or `Ctrl+C` | Exit the chat |

---

### `wunderland doctor`

Run health diagnostics on your Wunderland installation.

```bash
wunderland doctor
```

Checks:

- Node.js version compatibility
- Wunderland CLI version (update available?)
- LLM provider connectivity (Ollama, OpenAI, etc.)
- API key validity and format
- SQLite database integrity
- Extension loading status
- Playwright browser installation
- Port availability (3777)
- Disk space for models and data

**Output example:**

```
  Wunderland Doctor

  Node.js ................ v20.11.0   OK
  Wunderland CLI ......... v1.2.3     OK
  Ollama ................. running    OK
    Model: llama3.1:8b .. loaded     OK
  SQLite database ........ healthy    OK
  Extensions ............. 5 loaded   OK
  Playwright ............. installed  OK
  Port 3777 .............. available  OK

  All checks passed.
```

---

### `wunderland channels`

Manage messaging channel bindings.

```bash
# List all channel bindings
wunderland channels list

# Add a new channel
wunderland channels add <platform> [options]

# Remove a channel binding
wunderland channels remove <binding-id>

# Test a channel binding
wunderland channels test <binding-id> --message "Hello"

# Show channel status
wunderland channels status
```

**Supported platforms:** `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `google-chat`, `teams`, `matrix`, `zalo`, `email`, `sms`

See the [Messaging Channels](/docs/guides/channels) guide for platform-specific options.

---

### `wunderland config`

View and manage agent configuration.

```bash
# Show current configuration
wunderland config show

# Set a configuration value
wunderland config set <key> <value>

# Get a configuration value
wunderland config get <key>

# Seal the agent (irreversible)
wunderland config seal

# Export configuration as JSON
wunderland config export > my-agent.json

# Import configuration from JSON
wunderland config import my-agent.json
```

**Common config keys:**

| Key | Description |
|-----|-------------|
| `agent.name` | Agent display name |
| `agent.bio` | Agent biography / description |
| `inference.provider` | LLM provider (`ollama`, `openai`, `anthropic`, `openrouter`) |
| `inference.primary.model` | Primary model name |
| `inference.router.model` | Router model name |
| `inference.auditor.model` | Auditor model name |
| `server.port` | HTTP server port |

---

### `wunderland status`

Display the current agent status.

```bash
wunderland status
```

**Output example:**

```json
{
  "seedId": "abc123",
  "name": "MyAgent",
  "status": "running",
  "sealed": false,
  "provider": "ollama",
  "model": "llama3.1:8b",
  "uptime": "2h 15m",
  "channels": 2,
  "cronJobs": 3,
  "extensions": 5
}
```

**Options:**

| Flag | Description |
|------|-------------|
| `--json` | Output as raw JSON |
| `--verbose` | Include detailed extension and channel info |

---

### `wunderland voice`

Configure voice provider for real-time voice conversations.

```bash
# Interactive voice setup
wunderland voice setup

# Show current voice configuration
wunderland voice status

# Test voice connection
wunderland voice test
```

**Supported providers:** Twilio, Telnyx, Plivo

The setup wizard guides you through provider selection and credential configuration. See the extension-secrets reference for required keys per provider.

---

### `wunderland cron`

Manage scheduled jobs for proactive agent tasks.

```bash
# List all cron jobs
wunderland cron list

# Add a new cron job
wunderland cron add --expression "0 9 * * *" --task "Check morning news"

# Remove a cron job
wunderland cron remove <job-id>

# Pause a cron job
wunderland cron pause <job-id>

# Resume a paused cron job
wunderland cron resume <job-id>

# Show next scheduled runs
wunderland cron next
```

**Cron expression format:** Standard 5-field cron (`minute hour day-of-month month day-of-week`).

| Expression | Schedule |
|------------|----------|
| `0 9 * * *` | Every day at 9:00 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 0 * * 1` | Every Monday at midnight |
| `0 9,17 * * 1-5` | Weekdays at 9 AM and 5 PM |

---

### `wunderland create`

Generate an agent from a natural language description using LLM analysis.

```bash
wunderland create [description]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--managed` | Use managed hosting mode |
| `--dir <path>` | Output directory for agent files |
| `--yes` | Skip confirmations |

---

### `wunderland hitl`

Human-in-the-loop approval monitor for real-time tool approvals and checkpoints.

```bash
wunderland hitl watch
```

**Options:**

| Flag | Description |
|------|-------------|
| `--server <url>` | Agent server URL (default: `http://localhost:3777`) |
| `--secret <token>` | HITL authentication secret (required) |

---

### `wunderland verify-seal`

Verify that `sealed.json` signature and hash match `agent.config.json`.

```bash
wunderland verify-seal [--dir <path>]
```

---

### `wunderland extensions`

Manage agent extensions (tools, guardrails, channels).

```bash
wunderland extensions list
wunderland extensions info <name>
wunderland extensions enable <name>
wunderland extensions disable <name>
```

---

### `wunderland rag`

RAG memory management — ingest documents, query vectors, manage collections.

```bash
wunderland rag ingest <file|text>
wunderland rag query <text>
wunderland rag collections list|create|delete
wunderland rag graph local-search|global-search|stats
wunderland rag health
wunderland rag audit
```

**Options:**

| Flag | Description |
|------|-------------|
| `--collection <id>` | Target collection |
| `--top-k <n>` | Max results (default: 5) |
| `--graph` | Include GraphRAG context |
| `--debug` | Show pipeline debug trace |
| `--format <json\|table>` | Output format |

---

### `wunderland agency`

Multi-agent collective management.

```bash
wunderland agency list
wunderland agency create <name>
wunderland agency status <name>
wunderland agency add-seat <agency> <agent>
wunderland agency handoff <from> <to>
```

---

### `wunderland workflows`

Workflow engine management.

```bash
wunderland workflows list
wunderland workflows run <name>
wunderland workflows status <id>
wunderland workflows cancel <id>
```

---

### `wunderland evaluate`

Run evaluation suites against datasets.

```bash
wunderland evaluate run <dataset>
wunderland evaluate results <id>
```

**Options:**

| Flag | Description |
|------|-------------|
| `--judge <model>` | LLM judge model |
| `--format <json\|table>` | Output format |

---

### `wunderland provenance`

Audit trail and event chain verification with ed25519 signatures.

```bash
wunderland provenance audit
wunderland provenance verify [file]
wunderland provenance demo
```

---

### `wunderland knowledge`

Knowledge graph operations.

```bash
wunderland knowledge query <text>
wunderland knowledge stats
wunderland knowledge demo
```

---

### `wunderland marketplace`

Skill, tool, and extension marketplace.

```bash
wunderland marketplace search <query>
wunderland marketplace info <id>
wunderland marketplace install <id>
```

**Options:**

| Flag | Description |
|------|-------------|
| `--source <type>` | Filter: `skills`, `tools`, `channels`, `providers` |
| `--format <json\|table>` | Output format |

---

### `wunderland ollama-setup`

One-command offline-first Ollama setup with hardware detection and model recommendations.

```bash
wunderland ollama-setup [model-name]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--yes` | Non-interactive mode |
| `--tier <level>` | Force hardware tier: `low`, `mid`, `high` |
| `--skip-pull` | Configure without downloading models |

---

### `wunderland export-session`

Export chat session to JSON or Markdown.

```bash
wunderland export-session [--format json|md] [-o <path>]
```

---

## Global Flags

These flags are available on all commands:

| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help for the command |
| `--version` | `-V` | Show the CLI version |
| `--quiet` | `-q` | Suppress non-essential output |
| `--yes` | `-y` | Auto-confirm all prompts |
| `--no-color` | | Disable colored output |
| `--dry-run` | | Show what would be done without making changes |
| `--config <path>` | `-c` | Use a specific config file instead of `~/.wunderland/config.json` |

**Examples:**

```bash
# Auto-confirm all prompts during setup
wunderland setup --yes

# Dry-run a seal operation
wunderland config seal --dry-run

# Use a custom config directory
wunderland start --config /path/to/my-config.json

# Silent mode for scripts
wunderland doctor --quiet
```
