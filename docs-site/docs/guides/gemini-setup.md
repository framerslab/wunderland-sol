---
sidebar_position: 21
---

# Gemini Provider Setup

Google's Gemini models work as a first-class provider in Wunderland. Three models available, one API key, and routing happens through Google's OpenAI-compatible endpoint so tool calling works out of the box.

## Get an API Key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key (starts with `AIza...`)

Free tier includes generous rate limits. No credit card required.

## Setup

### Via the CLI Wizard

```bash
wunderland setup
```

Select **Google Gemini** from the provider list. Paste your API key when prompted. Done.

Or during agent creation:

```bash
wunderland init my-agent
```

The wizard detects `GEMINI_API_KEY` in your environment and offers Gemini as an option.

### Via Environment Variable

```bash
export GEMINI_API_KEY="AIza..."
wunderland init my-agent
```

### Via agent.config.json

```json
{
  "llmProvider": "gemini",
  "llmModel": "gemini-2.0-flash"
}
```

The API key can be set in the environment or stored in `~/.wunderland/config.json`:

```json
{
  "geminiApiKey": "AIza..."
}
```

## Available Models

| Model | Speed | Quality | Best for |
|-------|-------|---------|----------|
| `gemini-2.0-flash` | Fast | High | General-purpose agents, default choice |
| `gemini-2.0-flash-lite` | Fastest | Good | Router/classifier tasks, sentiment analysis, budget-conscious |
| `gemini-2.5-pro` | Slower | Highest | Complex reasoning, long-context analysis |

Wunderland automatically uses `gemini-2.0-flash-lite` as the small model for internal tasks (query classification, sentiment analysis, security auditing) when Gemini is your primary provider. This is handled by the `SmallModelResolver` -- no manual configuration needed.

## Multi-Provider Detection

When multiple API keys are present in the environment, Wunderland detects all of them:

```bash
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="AIza..."
```

The setup wizard lists all detected providers and lets you choose a primary. The others remain available as fallbacks.

If `OPENROUTER_API_KEY` is also set, it acts as an automatic fallback when the primary provider fails (rate limits, outages).

## How Routing Works

Gemini uses Google's OpenAI-compatible endpoint:

```
https://generativelanguage.googleapis.com/v1beta/openai/
```

Wunderland routes all requests through this endpoint using the standard OpenAI SDK format. Tool calling, function calling, and structured outputs work identically to OpenAI. The agent code doesn't know or care which provider is running underneath.

When you set `llmProvider: "gemini"`, Wunderland automatically:
1. Sets the base URL to Google's OpenAI-compatible endpoint
2. Uses `GEMINI_API_KEY` for authentication
3. Maps the model name directly (no translation needed)
4. Shows "Gemini" in error messages instead of "OpenAI"

## Troubleshooting

### "404 Not Found" errors

The most common cause is a double-slash in the URL. The Gemini endpoint base URL already ends with a trailing slash:

```
https://generativelanguage.googleapis.com/v1beta/openai/
```

If your `llmBaseUrl` override also adds a trailing slash, the final URL becomes:

```
https://generativelanguage.googleapis.com/v1beta/openai//chat/completions
```

That double slash causes a 404. The fix: don't override the base URL unless you have a specific reason. Wunderland sets it correctly by default when `llmProvider` is `"gemini"`.

If you must override, omit the trailing slash:

```json
{
  "llmProvider": "gemini",
  "llmBaseUrl": "https://generativelanguage.googleapis.com/v1beta/openai"
}
```

### "Invalid API key"

Verify your key works:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

If this returns a JSON list of models, the key is valid. If it returns an error, regenerate the key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Error messages say "OpenAI" instead of "Gemini"

Because Gemini uses the OpenAI-compatible endpoint, some error messages from the HTTP client may reference "OpenAI". Wunderland's error handler remaps these based on the base URL -- if you see "OpenAI" in a Gemini error, check that your base URL contains `generativelanguage.googleapis.com`.

### Model not found

Ensure you're using a valid model name. The three supported models are:
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`
- `gemini-2.5-pro`

Older model names (like `gemini-pro` or `gemini-1.5-flash`) may not be available through the OpenAI-compatible endpoint.

### Rate limits

Free-tier Gemini has rate limits (requests per minute varies by model). If you hit them:
- Set `OPENROUTER_API_KEY` as a fallback -- Wunderland auto-routes to it on failure
- Upgrade to a paid Google AI plan
- Use `gemini-2.0-flash-lite` for lower-priority calls (it has higher free-tier limits)

## Configuration Reference

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google AI Studio API key |

### agent.config.json

```json
{
  "llmProvider": "gemini",
  "llmModel": "gemini-2.0-flash",
  "llmBaseUrl": "https://generativelanguage.googleapis.com/v1beta/openai/"
}
```

The `llmBaseUrl` field is optional -- Wunderland sets it automatically when `llmProvider` is `"gemini"`.

### CLI Commands

```bash
# List all providers and test connectivity
wunderland models

# Test Gemini specifically
wunderland models test gemini

# Switch an existing agent to Gemini
wunderland config set llmProvider gemini
wunderland config set llmModel gemini-2.0-flash
```

## Related

- [Model Providers](./model-providers.md) -- All 13 supported providers
- [Inference Routing](./inference-routing.md) -- How models are selected per request
- [Ollama Local Setup](./ollama-local.md) -- Alternative: run models locally
