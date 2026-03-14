---
title: CLI Command Reference
sidebar_position: 2
---

# CLI Command Reference

Wunderland defaults to the interactive TUI when launched in a TTY with no subcommand. Use explicit subcommands for scripts, setup, diagnostics, or automation.

## Core Commands

| Command | Purpose |
| --- | --- |
| `wunderland` | Open the TUI dashboard |
| `wunderland setup` | Guided initial configuration |
| `wunderland help <topic>` | Short operator guides |
| `wunderland start` | Start the agent runtime/server |
| `wunderland chat` | Chat from the terminal |
| `wunderland doctor` | Health and configuration checks |
| `wunderland status` | Runtime and connection status |
| `wunderland init <dir>` | Scaffold a new agent project |
| `wunderland skills` | Inspect and manage skills |
| `wunderland extensions` | Inspect and manage extensions |
| `wunderland models` | Inspect provider/model configuration |

## Voice Commands

The current voice command family is:

```bash
wunderland voice status
wunderland voice tts
wunderland voice stt
wunderland voice test "Hello from Wunderland"
wunderland voice clone
```

What each subcommand does:

- `status` shows telephony/provider readiness
- `tts` lists text-to-speech providers and whether they are configured
- `stt` lists speech-to-text providers and whether they are configured
- `test <text>` synthesizes a short sample through the preferred runtime TTS provider
- `clone` explains currently supported voice-cloning provider paths

## Help Topics

Useful short guides:

```bash
wunderland help getting-started
wunderland help tui
wunderland help auth
wunderland help voice
wunderland help presets
```

## Common Operator Flow

```bash
wunderland setup
wunderland doctor
wunderland start
wunderland chat
```

For the runtime-backed voice path, pair this with the [Voice Runtime guide](../guides/voice-runtime).
