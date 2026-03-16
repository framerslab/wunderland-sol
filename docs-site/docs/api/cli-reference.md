---
title: CLI Command Reference
sidebar_position: 2
---

# CLI Command Reference

Wunderland defaults to the interactive TUI when launched in a TTY with no subcommand. Use explicit subcommands for scripts, setup, diagnostics, or automation.

---

## Core Commands

| Command | Purpose |
| --- | --- |
| `wunderland` | Open the TUI dashboard |
| `wunderland setup` | Guided initial configuration (QuickStart or Advanced) |
| `wunderland doctor` | Health and configuration checks |
| `wunderland chat` | Interactive chat from the terminal |
| `wunderland start` | Start the agent runtime/server |
| `wunderland init <dir>` | Scaffold a new agent project |
| `wunderland status` | Runtime and connection status |
| `wunderland help <topic>` | Short operator guides |

---

## Setup & Configuration

### `wunderland setup`

Interactive setup wizard. Configures LLM provider, personality, channels, RAG memory, and voice.

```bash
wunderland setup           # Interactive mode
wunderland setup --yes     # Auto-accept defaults
```

**QuickStart mode** covers 5 steps: LLM provider, personality preset, channels, RAG memory, and voice.
**Advanced mode** adds: custom HEXACO sliders, extensions/skills, security pipeline, and granular TTS/STT customization.

### `wunderland init <dir>`

Scaffold a new agent project.

```bash
wunderland init my-agent
wunderland init my-agent --preset research-assistant
wunderland init my-agent --provider openai --model gpt-4o
wunderland init my-agent --security-tier strict
```

### `wunderland config`

Read and write configuration values.

```bash
wunderland config get llmProvider            # Read a value
wunderland config set llmProvider anthropic   # Set a value
wunderland config set llmModel claude-sonnet-4-6
wunderland config set voiceProvider openai
wunderland config set ui.theme cyberpunk
```

Config is stored at `~/.wunderland/config.json`.

### `wunderland doctor`

Check configuration, API keys, provider connectivity, and voice readiness.

```bash
wunderland doctor
```

---

## Chat & Runtime

### `wunderland chat`

Start an interactive chat session.

```bash
wunderland chat                        # Default mode
wunderland chat --provider openai      # Override provider
wunderland chat --model gpt-4o-mini    # Override model
wunderland chat --overdrive            # Auto-approve tool calls
wunderland chat --auto-approve-tools   # Fully autonomous
```

**In-chat commands:**
| Command | Action |
|---------|--------|
| `/help` | Show available commands |
| `/tools` | List available tools |
| `/clear` | Clear conversation history |
| `/exit` | End the session |

### `wunderland start`

Start the agent runtime server.

```bash
wunderland start                    # Default port
wunderland start --port 3001        # Custom port
wunderland start --overdrive        # Auto-approve tools
```

### `wunderland status`

Show runtime status and active connections.

```bash
wunderland status
```

---

## Voice Commands

```bash
wunderland voice status              # Check provider readiness
wunderland voice tts                 # List TTS providers
wunderland voice stt                 # List STT providers
wunderland voice test "Hello"        # Synthesize a test phrase
wunderland voice clone               # Voice cloning guidance
```

### Details

- `status` — Shows telephony, TTS, and STT provider readiness with configuration details
- `tts` — Lists all text-to-speech providers and whether they are configured
- `stt` — Lists all speech-to-text providers and whether they are configured
- `test <text>` — Synthesizes a short sample through the preferred runtime TTS provider
- `clone` — Explains supported voice-cloning provider paths (ElevenLabs)

### Quick Voice Setup

```bash
# If you have an OpenAI key, voice is one command:
wunderland config set voiceProvider openai

# Or re-run setup (voice is included in QuickStart)
wunderland setup
```

---

## Extensions & Skills

### `wunderland extensions`

```bash
wunderland extensions list           # List available extensions
wunderland extensions add web-search # Add an extension
wunderland extensions remove giphy   # Remove an extension
```

### `wunderland skills`

```bash
wunderland skills list               # List available skills
wunderland skills add summarize      # Add a skill
wunderland skills show web-search    # Show skill details
```

### `wunderland models`

```bash
wunderland models                    # Show current provider/model info
```

---

## Agent Management

### `wunderland list-presets`

List all available agent presets.

```bash
wunderland list-presets
```

Presets include: `research-assistant`, `customer-support`, `coding-agent`, `creative-writer`, and more.

### `wunderland seal`

Seal an agent's configuration (immutability).

```bash
wunderland seal
```

### `wunderland export` / `wunderland import`

Export and import agent configurations.

```bash
wunderland export my-agent.json
wunderland import my-agent.json
```

---

## Ollama (Local LLM)

### `wunderland ollama-setup`

Auto-detect hardware, install Ollama, recommend models, and configure.

```bash
wunderland ollama-setup              # Interactive
wunderland ollama-setup --yes        # Non-interactive
wunderland ollama-setup --tier mid   # Force tier
wunderland ollama-setup --skip-pull  # Configure without downloading
wunderland ollama-setup mistral:7b   # Override model
```

---

## Authentication

### `wunderland login`

Authenticate with a ChatGPT subscription (OpenAI OAuth).

```bash
wunderland login
```

### `wunderland auth-status`

Check current authentication state.

```bash
wunderland auth-status
```

### `wunderland logout`

Remove stored OAuth tokens.

```bash
wunderland logout
```

---

## Workflows & Scheduling

### `wunderland workflows`

```bash
wunderland workflows create daily-report   # Create a workflow
wunderland workflows list                  # List workflows
wunderland workflows show daily-report     # Show details
wunderland workflows run daily-report      # Run manually
wunderland workflows delete daily-report   # Delete
```

### `wunderland cron`

```bash
wunderland cron add "0 9 * * 1-5" daily-report  # Schedule
wunderland cron list                              # List jobs
wunderland cron remove <job-id>                   # Remove
wunderland cron pause <job-id>                    # Pause
wunderland cron resume <job-id>                   # Resume
```

---

## Help Topics

```bash
wunderland help getting-started    # First-run guide
wunderland help voice              # Voice/speech setup
wunderland help llm                # LLM provider info
wunderland help auth               # OAuth and API keys
wunderland help tui                # TUI dashboard usage
wunderland help presets            # Agent presets
wunderland help security           # Approvals and permissions
wunderland help faq                # Frequently asked questions
wunderland help ui                 # Themes and ASCII mode
wunderland help export             # PNG export
```

---

## Global Flags

| Flag | Effect |
|------|--------|
| `--yes` / `-y` | Auto-confirm prompts |
| `--dry-run` | Show what would happen without writing |
| `--config <path>` | Override config directory |
| `--theme <name>` | Set UI theme (`cyberpunk`, `plain`) |
| `--ascii` | Force ASCII-only glyphs |
| `--no-color` | Disable colors |
| `--overdrive` | Auto-approve tool calls |
| `--auto-approve-tools` | Fully autonomous tool execution |
| `--dangerously-skip-permissions` | Skip permission checks |
| `--dangerously-skip-command-safety` | Disable shell safety checks |
| `--export-png <path>` | Export command output as PNG |

---

## Common Operator Flows

### First-Time Setup

```bash
wunderland setup
wunderland doctor
wunderland chat
```

### Daily Development

```bash
wunderland start          # Terminal 1
wunderland chat           # Terminal 2
```

### Voice Testing

```bash
wunderland voice status
wunderland voice test "Hello from Wunderland"
```

### Provider Switching

```bash
wunderland config set llmProvider anthropic
wunderland config set llmModel claude-sonnet-4-6
wunderland doctor   # verify
wunderland chat     # test
```

For the runtime-backed voice path, see the [Voice Runtime guide](../guides/voice-runtime).
