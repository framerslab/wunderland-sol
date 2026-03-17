---
sidebar_position: 14
---

# Extension Configuration

Wunderland extensions are modular capability packs — tools, voice providers, productivity integrations, cloud deployers, and more. This guide covers how to discover, enable, configure, and set provider defaults.

## Quick Reference

```bash
# List all extensions
wunderland extensions list

# See what an extension needs
wunderland extensions info image-generation

# Enable an extension for this agent
wunderland extensions enable email-gmail

# Set global provider defaults (image gen, TTS, STT, web search)
wunderland extensions configure

# Configure a specific extension
wunderland extensions configure image-generation

# Add extensions to global defaults
wunderland extensions set-default image-generation email-gmail
```

## Two-Tier Settings

Extension configuration follows a two-tier model, similar to Git's global/local config:

| Tier | File | Scope |
|------|------|-------|
| **Global** | `~/.wunderland/config.json` | All agents |
| **Per-agent** | `agent.config.json` | This agent only |

**Precedence:** `agent.config.json` > `~/.wunderland/config.json` > hardcoded defaults.

If an agent has no `extensions` field in its config, it inherits global defaults. If global has none, hardcoded defaults apply.

### Global Config Example

```json
{
  "extensions": {
    "tools": ["web-search", "image-generation", "deep-research"],
    "voice": ["speech-runtime"],
    "productivity": ["email-gmail"]
  },
  "providerDefaults": {
    "imageGeneration": "openai",
    "tts": "elevenlabs",
    "stt": "openai",
    "webSearch": "serper"
  },
  "extensionOverrides": {
    "image-generation": {
      "priority": 10,
      "options": { "defaultProvider": "stability" }
    }
  }
}
```

### Per-Agent Config Example

```json
{
  "llmProvider": "ollama",
  "llmModel": "qwen2.5:7b",
  "extensions": {
    "tools": ["cli-executor", "web-search", "deep-research"],
    "productivity": []
  },
  "extensionOverrides": {
    "web-search": {
      "options": { "defaultProvider": "duckduckgo" }
    }
  }
}
```

This agent uses DuckDuckGo for web search (overriding the global Serper default) and has no productivity extensions (explicitly empty array overrides global).

## Provider Defaults

Set default providers for capability categories. These apply to all agents unless overridden.

```bash
wunderland extensions configure
```

Interactive prompts for:

| Category | Options |
|----------|---------|
| Image generation | OpenAI (DALL-E 3), Stability AI (SDXL) |
| Text-to-speech | OpenAI TTS, ElevenLabs |
| Speech-to-text | OpenAI Whisper, Deepgram, Whisper-local |
| Web search | Serper (Google), Brave Search, DuckDuckGo |

Saved to `~/.wunderland/config.json` under `providerDefaults`.

## API Keys

Each extension may require API keys. Use `extensions info` to check status:

```bash
wunderland extensions info image-generation
```

Output:
```
Extension: Image Generation
Name:        image-generation
Category:    tool
Description: Generate images from text prompts using DALL-E 3 or Stability AI.

API Keys / Environment Variables:
  OPENAI_API_KEY      ✓ set
  STABILITY_API_KEY   ✗ not set
  Get keys: https://platform.openai.com/api-keys
```

Set keys in your environment or `.env` file:

```bash
export OPENAI_API_KEY=sk-...
export STABILITY_API_KEY=sk-...
```

## Common Extensions

### Tools

| Name | API Keys | Description |
|------|----------|-------------|
| `web-search` | `SERPER_API_KEY` or `BRAVE_API_KEY` | Web search (DuckDuckGo works without keys) |
| `deep-research` | `SERPER_API_KEY` | Multi-source investigation, trending, academic |
| `image-generation` | `OPENAI_API_KEY` or `STABILITY_API_KEY` | DALL-E 3 / Stability AI text-to-image |
| `image-search` | `PEXELS_API_KEY` or `UNSPLASH_ACCESS_KEY` | Search stock photo libraries |
| `cli-executor` | None | Shell command execution |
| `web-browser` | None | Headless browser automation |
| `stealth-browser` | None | Anti-detection browser automation for bot-protected sites |
| `github` | `GITHUB_TOKEN` | GitHub repos, issues, PRs |
| `weather` | `WEATHERAPI_KEY` (optional) | Weather lookup (Open-Meteo free fallback) |
| `giphy` | `GIPHY_API_KEY` | GIF search |
| `news-search` | `NEWSAPI_API_KEY` | News article search |

### Productivity

| Name | API Keys | Description |
|------|----------|-------------|
| `email-gmail` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Gmail send, read, search, reply |
| `calendar-google` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | Calendar events CRUD |

### Voice

| Name | API Keys | Description |
|------|----------|-------------|
| `speech-runtime` | `OPENAI_API_KEY` and/or `ELEVENLABS_API_KEY` | Whisper STT + OpenAI/ElevenLabs TTS |

## Auto-Detection

Some extensions load automatically when their API keys are present in the environment:

- **GitHub** — auto-loads when `GITHUB_TOKEN` or `GH_TOKEN` is set (or `gh` CLI is authenticated)
- **Telegram** — auto-loads when `TELEGRAM_BOT_TOKEN` is set
- **Gmail** — auto-loads when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REFRESH_TOKEN` are all set
- **Google Calendar** — same Google credentials as Gmail

## Runtime Extension Loading

Agents can discover and load extensions mid-conversation using built-in meta-tools:

- `extensions_list` — see all available extension packs
- `extensions_enable` — load an extension pack into the current session
- `extensions_status` — check what's currently loaded

When you ask for something the agent can't do, it checks `extensions_list` for available extensions and suggests what API keys you need.

## Sealed Agents

If an agent has a `sealed.json` file, extension configuration is locked. Use `wunderland verify-seal` to check integrity. Sealed agents cannot have extensions added or removed via CLI.
