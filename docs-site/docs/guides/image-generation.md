---
sidebar_position: 17
---

# Image Generation

Wunderland agents can generate images from text prompts using DALL-E 3 (OpenAI) or Stability AI (SDXL). The agent gets a single `generate_image` tool that routes to whichever provider you configure.

## Providers

| Provider | Model | Strengths |
|----------|-------|-----------|
| **OpenAI** | DALL-E 3 | Strong prompt adherence, text rendering, photorealistic output |
| **Stability AI** | SDXL 1.0 | Fine-grained style control, open-source model, competitive pricing |

## API Keys

Set the key for your preferred provider:

```bash
# OpenAI (DALL-E 3)
export OPENAI_API_KEY=sk-...

# Stability AI (SDXL)
export STABILITY_API_KEY=sk-...
```

Both can be set simultaneously. The agent uses the configured default provider and falls back to whichever key is available.

## Auto-Detection

The image generation extension loads automatically when `OPENAI_API_KEY` is present in the environment. No need to run `wunderland extensions enable` — the agent detects the key and adds the tool at startup.

To use Stability AI as the sole provider (without OpenAI), enable the extension explicitly:

```bash
wunderland extensions enable image-generation
```

## The `generate_image` Tool

The agent exposes a single tool with these options:

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `prompt` | Yes | — | Text description of the image to generate |
| `size` | No | `1024x1024` | Output dimensions |
| `quality` | No | `standard` | Image quality level |
| `style` | No | `vivid` | Visual style |
| `provider` | No | Configured default | Override the provider for this request |

### Sizes

| Size | Aspect Ratio | Use Case |
|------|-------------|----------|
| `1024x1024` | 1:1 (square) | Social media posts, profile images |
| `1792x1024` | 16:9 (landscape) | Blog headers, presentations, desktop wallpapers |
| `1024x1792` | 9:16 (portrait) | Mobile wallpapers, stories, vertical content |

### Quality

| Quality | Description | Cost Impact |
|---------|-------------|-------------|
| `standard` | Good for most use cases — fast and affordable | 1x |
| `hd` | Higher detail and consistency, especially for complex scenes | ~2x |

### Style

| Style | Description |
|-------|-------------|
| `vivid` | Hyper-real, dramatic lighting, saturated colors |
| `natural` | Photographic, muted, realistic tones |

## Configuration

### Default Provider

Set your preferred provider globally:

```bash
wunderland extensions configure image-generation
```

Or in `~/.wunderland/config.json`:

```json
{
  "providerDefaults": {
    "imageGeneration": "openai"
  }
}
```

### Per-Agent Override

Override the global default in `agent.config.json`:

```json
{
  "extensionOverrides": {
    "image-generation": {
      "options": { "defaultProvider": "stability" }
    }
  }
}
```

## Example Usage

In a chat session:

```
You: Generate an image of a rabbit wearing VR goggles,
     floating in a neon-lit cyberpunk city

Agent: [calls generate_image with prompt, size: 1024x1024,
        quality: standard, style: vivid]

       Here's your image: [generated_image.png]
       A rabbit in VR goggles hovering above a cyberpunk cityscape
       with neon signs and rain-slicked streets.
```

Requesting specific options:

```
You: Create a landscape HD image of a minimalist Japanese garden,
     natural style

Agent: [calls generate_image with prompt, size: 1792x1024,
        quality: hd, style: natural]

       Here's your image: [generated_image.png]
```

## Pricing

| Provider | Size | Quality | Approximate Cost |
|----------|------|---------|-----------------|
| OpenAI (DALL-E 3) | 1024x1024 | Standard | $0.040 |
| OpenAI (DALL-E 3) | 1024x1024 | HD | $0.080 |
| OpenAI (DALL-E 3) | 1792x1024 | Standard | $0.080 |
| OpenAI (DALL-E 3) | 1792x1024 | HD | $0.120 |
| Stability AI (SDXL) | 1024x1024 | — | $0.002–0.006 |

Prices as of early 2026. Check provider documentation for current rates.

## Troubleshooting

**"Image generation not available"** — Check that `OPENAI_API_KEY` or `STABILITY_API_KEY` is set. Run `wunderland extensions info image-generation` to see key status.

**"Content policy violation"** — Both providers enforce content safety policies. Rephrase the prompt to avoid restricted content categories.

**Slow generation** — HD quality at larger sizes can take 10–15 seconds. Standard quality at 1024x1024 typically returns in 3–5 seconds.
