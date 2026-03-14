---
title: Troubleshooting & FAQ
sidebar_position: 9
---

# Troubleshooting & FAQ

> Common issues, solutions, and frequently asked questions.

---

## Diagnostics

Always start with the built-in diagnostics:

```bash
wunderland doctor
```

This checks:
- Configuration file validity
- API key presence and format
- Provider connectivity
- Voice provider readiness
- Extension loading
- Disk/memory health

---

## Common Issues

### Setup & Configuration

#### "No LLM provider configured"

```bash
# Run setup wizard
wunderland setup

# Or set directly
wunderland config set llmProvider openai
export OPENAI_API_KEY=sk-...
```

#### "Invalid API key" / 401 errors

1. Check the key format matches the provider:
   - OpenAI: starts with `sk-`
   - Anthropic: starts with `sk-ant-`
   - Gemini: starts with `AIza`
   - OpenRouter: starts with `sk-or-`

2. Verify the key is set:
```bash
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
```

3. Re-enter via setup:
```bash
wunderland setup
```

#### "Config file not found"

```bash
# Create default config
wunderland setup

# Or check the config location
ls ~/.wunderland/config.json
```

#### Config file location

All Wunderland config lives in `~/.wunderland/`:
```
~/.wunderland/
├── config.json          # Main configuration
├── .env                 # API keys and secrets
├── auth/                # OAuth tokens
│   └── openai.json
└── agents/              # Per-agent data
    └── {seedId}/
        ├── agent.db     # SQLite database
        └── rag/         # RAG memory storage
```

---

### LLM Provider Issues

#### "Could not connect to Ollama service"

1. Start Ollama: `ollama serve`
2. Check the port: `curl http://localhost:11434`
3. If using a remote server: `curl $OLLAMA_BASE_URL`
4. Run auto-setup: `wunderland ollama-setup`

#### OpenAI 429 (rate limit)

- Set `OPENROUTER_API_KEY` as an automatic fallback
- Or switch to a different model: `wunderland config set llmModel gpt-4o-mini`

#### Anthropic 529 (overloaded)

- Wait and retry — Anthropic has periodic capacity limits
- Set `OPENROUTER_API_KEY` for automatic fallback

#### Slow responses

1. Check your model — larger models are slower (`gpt-4o` > `gpt-4o-mini`)
2. For Ollama: ensure GPU offloading is enabled (`wunderland ollama-setup`)
3. Check network: `wunderland doctor`
4. Try a faster model: `wunderland config set llmModel gpt-4o-mini`

---

### Voice Issues

#### "No voice provider configured"

```bash
# Quick fix
wunderland config set voiceProvider openai
wunderland config set voiceModel tts-1
wunderland config set sttProvider openai-whisper
```

Or re-run `wunderland setup` — voice is now included in QuickStart mode.

#### "TTS synthesis failed"

1. Check your API key: `echo $OPENAI_API_KEY`
2. Run diagnostics: `wunderland voice status`
3. Test with a simple phrase: `wunderland voice test "Hello"`

#### "Piper not found" / "Whisper not found"

Local voice providers need their binaries on your PATH:
```bash
# Piper
# macOS: brew install piper
# Linux: see https://github.com/rhasspy/piper

# Whisper.cpp
# macOS: brew install whisper-cpp
# Linux: see https://github.com/ggerganov/whisper.cpp

# Verify
which piper
which whisper
```

#### ElevenLabs quota exceeded

- Check your usage at [elevenlabs.io/account](https://elevenlabs.io/account)
- Fall back to OpenAI TTS: `wunderland config set voiceProvider openai`

---

### Runtime Issues

#### "Extension not found"

```bash
# List available extensions
wunderland extensions list

# Install a specific extension
wunderland extensions add web-search
```

#### "Tool not found" during chat

The agent uses capability discovery to find tools. If a tool isn't found:
1. Check it's installed: `wunderland extensions list`
2. Check discovery: `wunderland chat` → ask "What tools do you have?"
3. Force-load extensions in config or code

#### Agent seems stuck / looping

1. Press `Ctrl+C` to interrupt
2. Check approvals mode — the agent may be waiting for tool approval
3. Use `--overdrive` flag for auto-approved tool calls:
```bash
wunderland chat --overdrive
```

#### High memory usage

1. Reduce RAG auto-ingest: `wunderland config set rag.autoIngest false`
2. Use a smaller context window for Ollama: `wunderland config set ollama.numCtx 2048`
3. Reduce loaded extensions — only load what you need

---

### Chat Issues

#### Chat won't start

```bash
# Check config
wunderland doctor

# Try with explicit provider
wunderland chat --provider openai

# Check if server is needed
wunderland start  # in one terminal
wunderland chat   # in another
```

#### Tool calls being denied

By default, side-effect tools require approval. Options:
- Approve individually when prompted
- Use `--overdrive` for auto-approval
- Configure in code: `approvals: { mode: 'auto-all' }`

---

## Frequently Asked Questions

### General

**Q: How do I change my LLM provider after setup?**

```bash
wunderland config set llmProvider anthropic
wunderland config set llmModel claude-sonnet-4-6
```
Or re-run `wunderland setup` to go through the wizard again.

**Q: What's the difference between QuickStart and Advanced setup?**

QuickStart covers the essentials: LLM provider, personality preset, channels, RAG memory, and voice (5 steps). Advanced adds: custom HEXACO personality sliders, extensions/skills picker, security pipeline tuning, and granular TTS/STT configuration.

**Q: Where are my credentials stored?**

API keys are in `~/.wunderland/.env` (chmod 600). Settings are in `~/.wunderland/config.json`. OAuth tokens are in `~/.wunderland/auth/`.

**Q: How do I check if everything is working?**

```bash
wunderland doctor
```

### Voice

**Q: Do I need separate API keys for voice?**

If you use OpenAI as your LLM, the same `OPENAI_API_KEY` covers TTS and Whisper STT. ElevenLabs and Deepgram require their own keys. Piper and Whisper.cpp are free and local.

**Q: Can I run voice fully offline?**

Yes — use Piper for TTS and Whisper.cpp for STT. No API keys needed:
```bash
wunderland config set voiceProvider piper
wunderland config set sttProvider whisper-local
```

**Q: How do I add voice to an existing agent?**

Re-run `wunderland setup`, or set config directly:
```bash
wunderland config set voiceProvider openai
wunderland config set voiceModel tts-1
wunderland config set sttProvider openai-whisper
```

### LLM Providers

**Q: Can I run fully offline without cloud APIs?**

Yes — use Ollama for LLM + Piper for TTS + Whisper.cpp for STT:
```bash
wunderland ollama-setup    # auto-detect hardware, pull models
wunderland config set voiceProvider piper
wunderland config set sttProvider whisper-local
```

**Q: How do I use OpenRouter as a fallback?**

Set `OPENROUTER_API_KEY` alongside your primary provider key. If the primary fails, OpenRouter retries automatically.

**Q: Can I use my ChatGPT subscription instead of an API key?**

Yes — run `wunderland login` to authenticate with OAuth. See `wunderland help auth` for details.

**Q: Which provider should I choose?**

| Priority | Provider | Why |
|----------|----------|-----|
| Best quality | OpenAI (`gpt-4o`) or Anthropic (`claude-sonnet-4-6`) | Strongest tool calling |
| Best value | OpenAI (`gpt-4o-mini`) or Gemini (`gemini-2.0-flash`) | Low cost, fast |
| Most private | Ollama (local) | Data never leaves your machine |
| Most flexible | OpenRouter | 200+ models, single API key |

### Extensions & Skills

**Q: How do I add new capabilities to my agent?**

```bash
# Add extensions (runtime tool packs)
wunderland extensions add web-search web-browser

# Add skills (prompt-based capabilities)
wunderland skills add summarize coding-agent
```

**Q: What's the difference between extensions and skills?**

Extensions are code packages that provide tools (functions the agent can call). Skills are prompt modules (SKILL.md files) that give the agent knowledge and behavior patterns. Most agents use both.

---

## Getting Help

```bash
# Built-in help topics
wunderland help getting-started
wunderland help voice
wunderland help llm
wunderland help auth
wunderland help security
wunderland help presets
wunderland help faq

# Full diagnostics
wunderland doctor

# Online docs
# https://docs.wunderland.sh
```

If you're still stuck:
- [GitHub Issues](https://github.com/jddunn/wunderland-sh/issues) — Bug reports
- [GitHub Discussions](https://github.com/jddunn/wunderland-sh/discussions) — Questions
- [Discord](https://discord.gg/wunderland) — Community help
