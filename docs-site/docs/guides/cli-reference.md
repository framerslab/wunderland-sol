---
sidebar_position: 18
title: CLI Reference
description: Full reference for all Wunderland CLI commands
---

# CLI Reference

The `wunderland` CLI is the primary interface for managing agents, channels, models, and configuration. It ships as part of the `wunderland` npm package and is available after global or local installation.

```bash
npm install -g wunderland
wunderland --help
```

## Interactive TUI Dashboard

When you run `wunderland` with no arguments in a TTY terminal, it launches an **interactive TUI dashboard** -- a keyboard-driven terminal interface with:

- Cyberpunk-styled frame with solid Unicode borders (`║`, `═`)
- Animated scan-line intro and banner typewriter effect
- Agent status panels (config, API keys, active channels)
- Quick action menu with arrow-key navigation and scroll support
- Responsive layout that adapts to terminal width (panels stack vertically on narrow screens)
- Voice configuration view with provider status

```bash
# Launch the TUI dashboard
wunderland
```

**Navigation:**

| Key | Action |
|-----|--------|
| `↑`/`↓` or `j`/`k` | Navigate actions |
| `Enter` | Select action |
| `1`-`7` | Direct shortcut to action |
| `d` | Doctor |
| `s` | Status |
| `v` | Voice view |
| `r` | Refresh |
| `q` / `Esc` | Quit |

The TUI dashboard auto-detects terminal dimensions and renders a width-adaptive tagline, side-by-side or stacked panels, and condensed footer keybindings on narrow screens.

---

## Global Options

These flags are accepted by every command:

| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help text |
| `--version` | `-v` | Show version |
| `--quiet` | `-q` | Suppress the startup banner |
| `--yes` | `-y` | Auto-accept prompts (headless / CI mode) |
| `--no-color` | | Disable colored output (also: `NO_COLOR` env) |
| `--dry-run` | | Preview changes without writing to disk |
| `--config <path>` | | Override the config directory path |
| `--export-png <path>` | | Export command output as a styled PNG screenshot |

---

## `wunderland setup`

Interactive onboarding wizard. Walks you through selecting an LLM provider, configuring API keys, choosing a personality preset, and enabling channels.

```bash
wunderland setup
```

This is the recommended entry point for first-time users. It writes `~/.wunderland/config.json` and `~/.wunderland/.env`.

**Two modes:**

| Mode | Steps | Personality |
|------|-------|-------------|
| **QuickStart** | LLM provider → personality preset → channels | Preset picker (Balanced, Helpful Assistant, Creative Thinker, etc.) |
| **Advanced** | LLM provider → personality enable/disable → full HEXACO (presets or custom sliders) → personality evolution toggle → channels → extensions → tool keys → security → voice | Full control including custom trait values and evolution |

The TUI dashboard shows configuration completeness:
- **configured** — LLM provider + agent name + personality preset are all set
- **partially configured** — LLM provider set but missing agent name or personality
- **not configured** — no LLM provider

---

## `wunderland init`

Scaffold a new Wunderbot project in the specified directory.

```bash
wunderland init <directory> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--preset <name>` | Use an agent preset (e.g. `research-assistant`, `code-reviewer`) |
| `--security-tier <tier>` | Security tier (`dangerous`, `permissive`, `balanced`, `strict`, `paranoid`) |
| `--force` | Overwrite existing files |

**Examples:**

```bash
# Scaffold with the research-assistant preset
wunderland init my-agent --preset research-assistant

# Scaffold with strict security and overwrite existing
wunderland init my-agent --preset security-auditor --security-tier strict --force
```

The command creates an `agent.config.json`, `PERSONA.md`, `.env.example`, and boilerplate files in the target directory.

---

## `wunderland start`

Start the local agent server. This launches the HTTP server, WebSocket gateway, and all configured channel adapters.

```bash
wunderland start [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--port <number>` | Server port (default: `PORT` env or `3777`) |
| `--model <id>` | Override the default LLM model |
| `--security-tier <tier>` | Override the security tier |
| `--skills-dir <path>` | Load skills from a custom directory |
| `--no-skills` | Disable skill loading entirely |
| `--dangerously-skip-permissions` | Auto-approve all tool calls |
| `--dangerously-skip-command-safety` | Disable shell command safety checks |

**Example:**

```bash
wunderland start --port 4000 --model gpt-4o --security-tier balanced
```

The WebChat interface is available at `http://localhost:<port>/chat` after startup.

---

## `wunderland chat`

Start an interactive terminal chat session with the agent.

```bash
wunderland chat [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--model <id>` | Override the LLM model for this session |
| `--dangerously-skip-permissions` | Auto-approve tool calls |
| `--dangerously-skip-command-safety` | Disable shell command safety checks |
| `--debug` | Enable verbose tool-calling logs (API requests, round details, tool results) |

**Example:**

```bash
wunderland chat --model llama3
```

Type your messages directly in the terminal. Press `Ctrl+C` to exit.

### Debug Mode

By default, `wunderland chat` runs quietly -- only tool invocation names and the final response are printed. For troubleshooting or bug reports, enable debug mode to see full tool-calling internals:

```bash
# Via environment variable
DEBUG=1 wunderland chat
WUNDERLAND_DEBUG=1 wunderland chat

# Via flag (when supported by your entry point)
wunderland chat --debug
```

Debug mode logs:
- LLM API POST requests (URL, model, tool count)
- Each round's tool calls with arguments
- Tool execution results (success/failure, truncated output)

The chat interface features a cyberpunk-styled frame matching the TUI dashboard aesthetic:
- Framed header showing agent name, model, and security tier
- Lavender-bordered boxes around assistant replies
- REPL commands: `/clear`, `/system <prompt>`, `/model <name>`, `/tools`, `/help`, `/exit`

---

## `wunderland doctor`

Health check that validates API keys, tool connectivity, LLM provider availability, and system dependencies.

```bash
wunderland doctor
```

Reports status for:
- LLM provider connectivity (tests each configured provider)
- API key validation
- Ollama installation and model availability
- Channel adapter status
- Skill registry integrity
- System dependencies (Node.js version, required binaries)

---

## `wunderland channels`

Manage messaging channel bindings. Without a subcommand, lists all configured channel bindings.

```bash
wunderland channels              # List all channels
wunderland channels add          # Add a channel interactively
wunderland channels remove <id>  # Remove a channel by binding ID
wunderland channels test <id>    # Send a test message
```

**`channels add` options:**

Specify the platform directly or run interactively:

```bash
wunderland channels add telegram --token "1234567890:ABCdef..."
wunderland channels add discord --token "MTIzNDU2..."
wunderland channels add slack --bot-token "xoxb-..." --app-token "xapp-..."
```

---

## `wunderland config`

View and modify the agent configuration.

```bash
wunderland config                  # Show full current config
wunderland config get <key>        # Get a specific config value
wunderland config set <key> <val>  # Set a config value
```

**Examples:**

```bash
wunderland config get provider
wunderland config set provider openai
wunderland config set model gpt-4o
wunderland config set securityTier strict
```

Configuration is stored in `~/.wunderland/config.json` by default.

---

## `wunderland status`

Show the current agent status, including connection state, active channels, loaded skills, security tier, and model configuration.

```bash
wunderland status
```

Displays:
- Agent seed ID and name
- Active security tier
- Current LLM provider and model
- Connected channels and their status
- Loaded skills
- Uptime (if server is running)

---

## `wunderland voice`

Manage voice/telephony provider configuration.

```bash
wunderland voice          # Show voice provider status
wunderland voice setup    # Interactive voice provider setup
```

Supports Twilio, Telnyx, and Plivo for real-time voice conversations.

---

## `wunderland cron`

Manage scheduled jobs for agent automation.

```bash
wunderland cron             # List scheduled jobs
wunderland cron list        # List scheduled jobs (explicit)
wunderland cron add         # Add a scheduled job interactively
wunderland cron remove <id> # Remove a scheduled job
```

Cron jobs allow agents to perform actions on a schedule (e.g., daily news digest, periodic health checks, social media posts).

---

## `wunderland seal`

Generate an integrity hash for the agent configuration. This creates a cryptographic seal that can be used to verify that the configuration has not been tampered with.

```bash
wunderland seal [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--dir <path>` | Directory containing the agent config to seal |

**Example:**

```bash
wunderland seal --dir ./my-agent
# Output: Sealed: sha256:abc123...
```

The seal is written to `agent.seal.json` and can be verified on subsequent runs.

---

## `wunderland login`

Authenticate with an LLM provider via OAuth. Currently supports OpenAI's device code flow (same as the Codex CLI), which uses your ChatGPT Plus/Pro subscription for API access.

```bash
wunderland login [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--provider <id>` | Provider to authenticate with (default: `openai`) |

**Example:**

```bash
wunderland login
# 1. Open your browser and visit: https://platform.openai.com/device
# 2. Enter the code: ABC-DEF
# Waiting for authorization...
# ✔ Authenticated — Token stored at ~/.wunderland/auth/openai.json
```

---

## `wunderland logout`

Clear stored OAuth tokens for a provider.

```bash
wunderland logout [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--provider <id>` | Provider to log out from (default: `openai`) |

**Example:**

```bash
wunderland logout
# ✔ Cleared OAuth tokens for openai.
```

---

## `wunderland auth-status`

Show the current OAuth authentication state for a provider.

```bash
wunderland auth-status [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--provider <id>` | Provider to check (default: `openai`) |

**Example output:**

```
OAuth Status — openai
  Status: Authenticated
  Token:  test-tok...xyz9
  Expires: 2/23/2026, 11:30 PM (58m remaining)
  Refresh: Available
```

See [OpenAI OAuth Guide](./openai-oauth.md) for full details.

---

## `wunderland list-presets`

List available agent personality presets and HEXACO profiles.

```bash
wunderland list-presets [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format (default: `table`) |

**Example output:**

```
 Preset                  Description                              Security Tier
 research-assistant      Thorough researcher with analytical      balanced
 customer-support        Patient, empathetic support specialist   strict
 creative-writer         Imaginative storyteller and content      balanced
 code-reviewer           Precise, detail-oriented code analyst    strict
 data-analyst            Systematic data interpreter              balanced
 security-auditor        Vigilant security-focused analyst        paranoid
 devops-assistant        Infrastructure and deployment specialist strict
 personal-assistant      Friendly, organized daily helper         balanced
```

---

## `wunderland skills`

Manage the agent skill registry.

```bash
wunderland skills                  # List loaded skills
wunderland skills list             # List available skills
wunderland skills info <name>      # Show skill details
wunderland skills enable <name>    # Enable a skill
wunderland skills disable <name>   # Disable a skill
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |

Skills extend agent capabilities beyond the built-in tools. See [Skills System](./skills-system.md) for details.

---

## `wunderland models`

Manage LLM providers and models.

```bash
wunderland models                        # List all providers and models
wunderland models set-default <p> <m>    # Set default provider and model
wunderland models test [provider]        # Test provider connectivity
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |

**Examples:**

```bash
# List all 13 supported providers
wunderland models

# Set OpenAI gpt-4o as default
wunderland models set-default openai gpt-4o

# Test Ollama connectivity
wunderland models test ollama
```

See [Model Providers](./model-providers.md) for the full provider list.

---

## `wunderland export`

Export the current agent as a shareable JSON manifest.

```bash
wunderland export [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-o <path>` | Output file path (default: `agent.manifest.json`) |
| `--dir <path>` | Agent directory to export from (default: current directory) |

**Examples:**

```bash
# Export from current directory
wunderland export

# Export to a specific file
wunderland export -o ~/backups/my-agent.json

# Export from a specific directory
wunderland export --dir ./my-agent -o agent-backup.json
```

The manifest includes HEXACO traits, security configuration, skills, channels, persona text, and an optional `configHash` for sealed agents. See [Agent Serialization](./agent-serialization.md) for the manifest format.

---

## `wunderland import`

Import an agent from a manifest file.

```bash
wunderland import <manifest-path> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--dir <path>` | Target directory (default: agent name from manifest) |
| `--force` | Overwrite existing files in the target directory |

**Examples:**

```bash
# Import into a new directory named after the agent
wunderland import agent.manifest.json

# Import into a specific directory
wunderland import agent.manifest.json --dir ./my-imported-agent

# Overwrite existing agent
wunderland import agent.manifest.json --dir ./existing-agent --force
```

Importing a sealed agent creates an unsealed copy with a warning. The original integrity hash is preserved in the manifest for reference.

---

## `wunderland plugins`

List installed extension packs and their status.

```bash
wunderland plugins [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |

Displays all registered extensions grouped by kind (tools, guardrails, channels, etc.). See [Extension Ecosystem](./extensions.md) for details.

---

## `wunderland create`

Create an agent from a natural language description. Uses LLM analysis to extract configuration from plain English.

```bash
wunderland create [description]
```

If no description is provided, the wizard prompts for one interactively. The LLM extracts personality traits, security tier, channels, extensions, and skills from the description.

**Options:**

| Flag | Description |
|------|-------------|
| `--managed` | Use managed hosting mode (default: self-hosted) |
| `--dir <path>` | Output directory for agent files |
| `--yes` | Skip all confirmations |

**Example:**

```bash
# Create from inline description
wunderland create "A security-focused code reviewer that uses strict permissions"

# Interactive mode
wunderland create
```

Creates a full project directory with `agent.config.json`, `.env.example`, `.gitignore`, `skills/` directory, and `README.md`.

---

## `wunderland hitl`

Human-in-the-loop approval monitor. Streams pending approvals and checkpoints from a running agent server and lets you approve, reject, or skip them interactively.

```bash
wunderland hitl watch [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--server <url>` | Agent server URL (env: `WUNDERLAND_SERVER_URL`, default: `http://localhost:3777`) |
| `--secret <token>` | HITL authentication secret (env: `WUNDERLAND_HITL_SECRET`, required) |

**Interactive prompts:**

- Approvals: `[y]es / [n]o / [s]kip`
- Checkpoints: `[y]es (continue) / [a]bort / [s]kip`

---

## `wunderland verify-seal`

Verify that `sealed.json` signature and hash match the agent's `agent.config.json`. Checks SHA-256 hash and ed25519 signature integrity.

```bash
wunderland verify-seal [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--dir <path>` | Agent directory to verify (default: current directory) |

---

## `wunderland extensions`

Manage agent extensions (tools, guardrails, channels, integrations).

```bash
wunderland extensions                     # List extensions
wunderland extensions list                # List available extensions
wunderland extensions info <name>         # Show extension details
wunderland extensions enable <name>       # Enable an extension
wunderland extensions disable <name>      # Disable an extension
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |

---

## `wunderland rag`

Manage RAG (Retrieval-Augmented Generation) memory — ingest documents, query the vector store, and manage collections.

```bash
wunderland rag ingest <file|text>         # Ingest a document
wunderland rag ingest-image <file>        # Ingest and caption an image
wunderland rag ingest-audio <file>        # Ingest and transcribe audio
wunderland rag query <text>               # Search RAG memory
wunderland rag query-media <text>         # Search media assets
wunderland rag collections list           # List collections
wunderland rag collections create <id>    # Create a collection
wunderland rag collections delete <id>    # Delete a collection
wunderland rag documents list             # List documents
wunderland rag documents delete <id>      # Delete a document
wunderland rag graph local-search <text>  # Local GraphRAG search
wunderland rag graph global-search <text> # Global GraphRAG search
wunderland rag graph stats                # GraphRAG statistics
wunderland rag stats                      # RAG statistics
wunderland rag health                     # Service health check
wunderland rag audit                      # View audit trail
```

**Options:**

| Flag | Description |
|------|-------------|
| `--collection <id>` | Target collection |
| `--category <name>` | Document category |
| `--top-k <n>` | Max results (default: 5) |
| `--preset <p>` | Retrieval preset (`fast`, `balanced`, `accurate`) |
| `--graph` | Include GraphRAG context in query results |
| `--debug` | Show pipeline debug trace |
| `--modality <m>` | Media filter: `image` or `audio` |
| `--format <json\|table>` | Output format |
| `--verbose` | Show detailed audit trail |

---

## `wunderland agency`

Manage multi-agent collectives (agencies). Create agent groups that can collaborate and hand off tasks.

```bash
wunderland agency list                    # List configured agencies
wunderland agency create <name>           # Create a multi-agent agency
wunderland agency status <name>           # Show agency status
wunderland agency add-seat <agency> <agent>  # Add agent to agency
wunderland agency handoff <from> <to>     # Trigger agent handoff
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |
| `--context <text>` | Handoff context message |

Requires a running backend with `ENABLE_SOCIAL_ORCHESTRATION=true`.

---

## `wunderland workflows`

Manage the workflow engine — define, run, and monitor multi-step automation workflows.

```bash
wunderland workflows list                 # List workflow definitions
wunderland workflows run <name>           # Execute a workflow
wunderland workflows status <id>          # Check workflow instance status
wunderland workflows cancel <id>          # Cancel a running workflow
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |

---

## `wunderland evaluate`

Run evaluation suites against datasets to benchmark agent quality.

```bash
wunderland evaluate run <dataset>         # Run evaluation on dataset
wunderland evaluate results <id>          # Show evaluation results
```

**Options:**

| Flag | Description |
|------|-------------|
| `--judge <model>` | LLM judge model (default: configured primary) |
| `--format <json\|table>` | Output format |

---

## `wunderland provenance`

Audit trail and event chain verification using ed25519-signed ledger entries.

```bash
wunderland provenance audit               # Show audit trail
wunderland provenance verify [file]       # Verify chain integrity from JSON
wunderland provenance demo                # Create and verify a demo chain
```

**Options:**

| Flag | Description |
|------|-------------|
| `--agent <id>` | Filter by agent ID |
| `--format <json\|table>` | Output format |

---

## `wunderland knowledge`

Query and manage the local in-memory knowledge graph.

```bash
wunderland knowledge query <text>         # Search entities by label/properties
wunderland knowledge stats                # Show graph statistics
wunderland knowledge demo                 # Load a demo graph
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |

---

## `wunderland marketplace`

Search and browse the skill, tool, channel, and provider marketplace.

```bash
wunderland marketplace search <query>     # Fuzzy search across marketplace
wunderland marketplace info <id>          # Show item details
wunderland marketplace install <id>       # Install extension via npm
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|table>` | Output format |
| `--source <type>` | Filter by source: `skills`, `tools`, `channels`, `providers` |

---

## `wunderland ollama-setup`

One-command offline-first agent setup with Ollama. Detects hardware, recommends models, downloads them, and configures the agent.

```bash
wunderland ollama-setup [model-name]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--yes` | Non-interactive mode; auto-accept all prompts |
| `--tier <level>` | Force hardware tier: `low`, `mid`, `high` |
| `--skip-pull` | Detect and configure without downloading models |

**Example:**

```bash
# Auto-detect hardware and recommend models
wunderland ollama-setup

# Force a specific model
wunderland ollama-setup mistral

# CI/headless mode
wunderland ollama-setup --yes --tier mid
```

---

## `wunderland export-session`

Export the current chat session to a JSON or Markdown file with metadata.

```bash
wunderland export-session [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--format <json\|md>` | Output format (default: `json`) |
| `-o <path>`, `--output <path>` | Output file path (default: `session-export-TIMESTAMP.{json\|md}`) |

**Example:**

```bash
# Export as JSON
wunderland export-session

# Export as Markdown
wunderland export-session --format md -o my-session.md
```

---

## PNG Screenshot Export

Any command supports `--export-png <path>` to capture its terminal output as a styled PNG image. The export pipeline:

1. Captures all ANSI-colored terminal output
2. Converts ANSI escape codes to HTML with the cyberpunk color theme
3. Renders the HTML to a PNG using headless Chromium (via Playwright)

```bash
# Export help screen as PNG
wunderland --help --export-png help.png

# Export doctor output as PNG
wunderland doctor --export-png doctor-status.png

# Export status as PNG
wunderland status --export-png status.png
```

The exported screenshots use a dark background with the same cyan/lavender/magenta color palette as the TUI dashboard.

---

## Voice Wizard

The `wunderland voice setup` command includes an enhanced configuration wizard:

```bash
wunderland voice setup
```

The wizard walks through:
1. **Provider selection** -- Choose from Twilio, Telnyx, or Plivo
2. **Credential entry** -- API keys, auth tokens, phone numbers
3. **Voice preference** -- Select TTS voice and test synthesis
4. **Verification** -- Test the connection and confirm setup

Voice configuration integrates with `DynamicVoiceProfile`, which maps HEXACO personality traits to TTS parameters (speed, pitch, expressiveness). See [Voice: TTS, STT, and Voice Cloning](./voice-tts-stt.md) for the full reference.

---

## Environment Variables

Key environment variables used by the CLI:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3777) |
| `NO_COLOR` | Disable colored output |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OLLAMA_HOST` | Ollama server URL (default: `http://localhost:11434`) |
| `WUNDERLAND_SIGNING_SECRET` | Secret key for output signing |
| `WUNDERLAND_CONFIG_DIR` | Override default config directory |

See [Environment Variables](../deployment/environment-variables.md) for the full list.
