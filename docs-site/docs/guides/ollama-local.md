---
sidebar_position: 13
---

# Running with Ollama (Local LLM)

Wunderland supports fully local, offline AI agents powered by [Ollama](https://ollama.com). No API keys. No cloud calls. All inference stays on your machine.

## Quickstart: One Command

```bash
wunderland init my-agent --local
```

That single command handles everything:

1. **Detects Ollama** on your system (installs it via Homebrew/curl/winget if missing)
2. **Starts the server** if it isn't running
3. **Analyzes your hardware** — RAM, GPU (Metal on macOS, CUDA on Linux, DirectX on Windows)
4. **Selects the best model** for your machine (3-tier recommendation engine)
5. **Pulls the model** automatically with progress streaming
6. **Scaffolds the agent** with Ollama configured as the provider, including optimized `numCtx` and `numGpu` settings

```
$ wunderland init my-agent --local

◆ Local Agent Setup (Ollama)
✓ Ollama found at /opt/homebrew/bin/ollama
✓ Ollama server running
◇ Detecting system specifications...
✓ darwin/arm64 — 16 GB RAM — Apple M3 (16 GB)
✓ Tier: high — model: qwen2.5:7b
◇ Pulling qwen2.5:7b...
  pulling 2bada8a74506: 100% ▕██████████████████▏ 4.7 GB
✓ qwen2.5:7b ready

╭  ✓ Agent Scaffolded ─────────────────────────────────────╮
│ Agent:     My Agent                                       │
│ Provider:  ollama                                         │
│ Model:     qwen2.5:7b                                     │
│ Next: cd my-agent && wunderland start                     │
╰───────────────────────────────────────────────────────────╯
```

Then start it:

```bash
cd my-agent
wunderland start
```

Test:

```bash
curl -X POST http://localhost:3777/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello", "sessionId": "test"}'
```

## How It Works

### Hardware Detection

Wunderland inspects your machine and picks the right model tier:

| RAM | GPU | Tier | Router | Primary | Auditor |
|-----|-----|------|--------|---------|---------|
| < 8 GB | Any | Low | `qwen2.5:1.5b` | `qwen2.5:3b` | `qwen2.5:1.5b` |
| 8–16 GB | Any | Mid | `qwen2.5:3b` | `qwen2.5:7b` | `qwen2.5:3b` |
| 16+ GB | < 40 GB VRAM | High | `qwen2.5:3b` | `qwen2.5:7b` | `qwen2.5:3b` |
| 48+ GB | Apple Silicon | High | `qwen2.5:3b` | `llama3.3` (70B) | `qwen2.5:3b` |
| Any | 40+ GB VRAM | High | `qwen2.5:3b` | `llama3.3` (70B) | `qwen2.5:3b` |

The three-tier inference hierarchy:

- **Router** — fast triage, tool-use decisions (small model)
- **Primary** — main conversation, reasoning (largest model your hardware supports)
- **Auditor** — guardrail checks, output validation (small model)

### GPU Offloading

| Platform | GPU | numGpu |
|----------|-----|--------|
| macOS (Apple Silicon) | Metal (unified memory) | `-1` (all layers) |
| Linux/Windows | NVIDIA with enough VRAM | `-1` (all layers) |
| Linux/Windows | NVIDIA with partial VRAM | Partial offload |
| Any | No GPU | `0` (CPU only) |

### Context Window

Context window (`numCtx`) is set based on available memory and model size. Range: 2048–8192 tokens. Larger models get more conservative context to avoid OOM.

## Agent Config

After `--local` init, your `agent.config.json` includes:

```json
{
  "llmProvider": "ollama",
  "llmModel": "qwen2.5:7b",
  "ollama": {
    "numCtx": 8192,
    "numGpu": -1
  }
}
```

The global config at `~/.wunderland/config.json` is also updated so future agents default to Ollama.

## Alternative Setup Methods

### Interactive Init

If you run `wunderland init my-agent` without `--local` and select **Ollama (local)** from the provider menu, the same auto-setup pipeline runs — no manual steps.

### Standalone Setup Command

```bash
wunderland ollama-setup
```

Configures Ollama globally without creating an agent. Useful flags:

| Flag | Description |
|------|-------------|
| `--yes` | Non-interactive — auto-accept all recommendations |
| `--skip-pull` | Detect and configure but don't download models |
| `--tier low\|mid\|high` | Force a specific hardware tier |

### Non-Interactive / CI

```bash
wunderland init my-agent --yes
```

When no API keys are found in the environment and Ollama is installed, `--yes` mode automatically falls back to Ollama. No prompts.

### Manual Model Selection

If you prefer to manage models yourself:

```bash
# Pull models manually
ollama pull qwen2.5:7b
ollama pull qwen2.5:3b

# List installed models
ollama list

# Create agent pointing to your chosen model
wunderland init my-agent --local
```

The auto-setup detects already-installed models and skips pulling them.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | Auto-detected | Override the primary model |

Example — point to a remote Ollama instance:

```bash
export OLLAMA_BASE_URL=http://192.168.1.100:11434
wunderland init my-agent --local
```

## Verifying Your Setup

```bash
# Health check
curl http://localhost:11434/api/tags

# Wunderland diagnostics
wunderland doctor

# Interactive chat
wunderland chat
```

## Performance Tips

- **GPU acceleration**: Ollama uses Metal (macOS) or CUDA (Linux) automatically. No extra config.
- **Context window**: Wunderland sets `numCtx` based on your hardware. Override in `agent.config.json` if needed.
- **Concurrent requests**: Ollama queues requests. For multi-agent setups, run multiple instances on different ports.
- **Model caching**: Models stay in memory after first use. Ollama unloads after 5 minutes of inactivity.
- **Disk space**: A 7B model is ~4.7 GB. A 3B model is ~2 GB. Check with `ollama list`.

## Troubleshooting

**"Ollama not found"** — Install via `brew install ollama` (macOS) or `curl -fsSL https://ollama.com/install.sh | sh` (Linux). The `--local` flag will attempt to install automatically.

**"Server not running"** — Run `ollama serve` or restart the Ollama desktop app. Wunderland auto-starts the server during setup, but it won't persist across reboots unless you configure a system service.

**"Model pull failed"** — Check your internet connection. Ollama needs to download the model weights once. After that, everything runs offline.

**Slow inference** — Ensure GPU offloading is active (`numGpu: -1` in config). On Linux, verify CUDA drivers with `nvidia-smi`. On macOS, Metal is used automatically on Apple Silicon.
