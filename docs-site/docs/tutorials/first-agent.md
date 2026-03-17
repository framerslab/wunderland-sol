---
title: "Tutorial: Build Your First Agent"
sidebar_position: 1
---

# Tutorial: Build Your First Agent

> From zero to a working Wunderland agent in 10 minutes.

This tutorial walks you through installing Wunderland, configuring your first agent, and having a conversation with it.

---

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **An LLM API key** — OpenAI, Anthropic, Gemini, or OpenRouter (or use Ollama for free local inference)

---

## Step 1: Install the CLI

```bash
npm install -g wunderland
```

Verify the installation:

```bash
wunderland --version
```

---

## Step 2: Run Setup

```bash
wunderland setup
```

The setup wizard walks you through:

1. **Mode** — Choose QuickStart (recommended for first-timers)
2. **Agent name** — Give your agent a name
3. **LLM provider** — Select OpenAI, Anthropic, Gemini, Ollama, or OpenRouter
4. **API key** — Paste your provider's API key
5. **Personality** — Pick a preset (Balanced, Analytical, Creative, etc.)
6. **Channels** — Select WebChat (default)
7. **RAG memory** — Enable for conversation memory
8. **Voice** — Optionally enable TTS/STT

After setup, your configuration is saved to `~/.wunderland/config.json` and API keys to `~/.wunderland/.env`.

---

## Step 3: Verify Your Environment

```bash
wunderland doctor
```

This checks your config, API keys, and provider connectivity. Everything should show green checkmarks.

---

## Step 4: Start Chatting

```bash
wunderland chat
```

You're now in an interactive chat session with your agent. Try:

```
You: What can you help me with?
You: Search the web for the latest TypeScript features
You: Summarize what you found
You: /help
```

### Chat Commands

| Command | Action |
|---------|--------|
| `/help` | Show available commands |
| `/tools` | List available tools |
| `/clear` | Clear conversation history |
| `/exit` | End the session |
| `Ctrl+C` | Interrupt current operation |

---

## Step 5: Explore the TUI Dashboard

```bash
wunderland
```

The TUI (terminal user interface) provides a visual dashboard:

- **Arrow keys** to navigate
- **Enter** to select
- **/** to search (command palette)
- **?** for help
- **v** for voice dashboard
- **t** for onboarding tour
- **q** to quit

---

## Step 6: Scaffold a Project

For a more structured setup, scaffold a project directory:

```bash
wunderland init my-agent --preset research-assistant
cd my-agent
```

This creates:

```
my-agent/
├── agent.config.json    # Agent-specific configuration
├── workflows/           # Scheduled workflows
├── skills/              # Custom SKILL.md files
└── README.md
```

Start the agent server:

```bash
wunderland start
```

Then connect with chat:

```bash
wunderland chat
```

---

## Step 7: Add Extensions

Extend your agent with tools:

```bash
# Add web search
wunderland extensions add web-search

# Add web browser for page content extraction
wunderland extensions add web-browser

# List all available extensions
wunderland extensions list
```

Now your agent can search the web and read web pages during conversations.

---

## Step 8: Test Voice (Optional)

If you enabled voice during setup:

```bash
# Check voice provider status
wunderland voice status

# Test text-to-speech
wunderland voice test "Hello, I'm your Wunderland agent!"

# Check STT provider
wunderland voice stt
```

---

## What's Next?

You now have a working agent. Here's where to go from here:

- **[Configuration Guide](/docs/getting-started/configuration)** — Fine-tune your setup
- **[LLM Provider Setup](/docs/guides/model-providers)** — Try different providers
- **[Extensions Guide](/docs/guides/extensions)** — Add more capabilities
- **[Voice Runtime](/docs/guides/voice-runtime)** — Configure speech
- **[Creating Agents](/docs/guides/creating-agents)** — Presets and advanced patterns
- **[Library API](/docs/guides/library-first-api)** — Embed in your own app
- **[Security Guide](/docs/guides/security)** — Harden for production

---

## Quick Reference

```bash
# Core commands
wunderland setup          # Initial configuration
wunderland doctor         # Health check
wunderland chat           # Interactive chat
wunderland start          # Start agent server
wunderland                # TUI dashboard

# Voice
wunderland voice status   # Provider readiness
wunderland voice test "Hello"  # TTS smoke test

# Management
wunderland extensions list    # Available extensions
wunderland skills list        # Available skills
wunderland models             # Provider/model info
wunderland config set <key> <value>  # Change settings

# Help
wunderland help getting-started
wunderland help voice
wunderland help llm
wunderland help faq
```
