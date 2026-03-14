---
title: CLI Operations Guide
sidebar_position: 2
---

# CLI Operations Guide

This page is the practical operator guide. For the full command list, see the [CLI Command Reference](../api/cli-reference).

## First Run

```bash
npm install -g wunderland
wunderland setup          # Interactive wizard (LLM, personality, voice, RAG)
wunderland doctor         # Verify everything works
wunderland chat           # Start chatting
```

## Typical Daily Loop

```bash
wunderland doctor         # Quick health check
wunderland start          # Start agent server (Terminal 1)
wunderland chat           # Chat session (Terminal 2)
```

## High-Value Commands

| Command | When To Use |
|---------|-------------|
| `wunderland setup` | First-time config or reconfiguration |
| `wunderland doctor` | Something isn't working |
| `wunderland help <topic>` | Quick inline guidance |
| `wunderland voice status` | Check TTS/STT readiness |
| `wunderland voice test "Hello"` | TTS smoke test |
| `wunderland extensions list` | See available tools |
| `wunderland skills list` | See available skills |
| `wunderland models` | Check provider/model info |
| `wunderland config set <key> <value>` | Change any setting |

## Provider Switching

```bash
# Switch LLM provider
wunderland config set llmProvider anthropic
wunderland config set llmModel claude-sonnet-4-6

# Switch voice provider
wunderland config set voiceProvider elevenlabs

# Use local models
wunderland ollama-setup
```

## Voice Commands

```bash
wunderland voice status              # Provider readiness
wunderland voice tts                 # List TTS providers
wunderland voice stt                 # List STT providers
wunderland voice test "Hello"        # Synthesize test phrase
wunderland voice clone               # Voice cloning guidance
```

## Security Modes

```bash
wunderland chat                      # Default: approve side-effects
wunderland chat --overdrive          # Auto-approve (keeps security pipeline)
wunderland chat --auto-approve-tools # Fully autonomous (CI/demos)
```

## TUI Dashboard

Launch `wunderland` with no subcommand in a TTY for the interactive dashboard:

- **/** — Search (command palette)
- **v** — Voice dashboard
- **t** — Onboarding tour
- **?** — Help overlay
- **q** — Quit

## Help Topics

```bash
wunderland help getting-started    # First-run guide
wunderland help voice              # Voice/speech setup
wunderland help llm                # LLM provider info
wunderland help auth               # OAuth and API keys
wunderland help faq                # Frequently asked questions
wunderland help security           # Approvals and permissions
wunderland help presets            # Agent presets
wunderland help tui                # TUI dashboard
```

## Troubleshooting

If something breaks:

1. Run `wunderland doctor` — checks config, keys, connectivity
2. Check `wunderland help faq` for common issues
3. See the [Troubleshooting guide](./troubleshooting) for detailed solutions
