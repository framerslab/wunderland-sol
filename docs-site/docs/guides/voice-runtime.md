---
title: Voice Runtime
sidebar_position: 7
---

# Voice Runtime

> Configure TTS (text-to-speech), STT (speech-to-text), and VAD for voice-enabled agents.

Wunderland uses the shared **AgentOS speech runtime** — a provider-agnostic abstraction layer for all voice capabilities. Configure once, swap providers freely.

---

## Quick Setup

The fastest path to voice is through the setup wizard:

```bash
wunderland setup
# Voice is included in both QuickStart and Advanced modes
```

If you chose OpenAI as your LLM provider, voice is **zero extra config** — your existing `OPENAI_API_KEY` covers both TTS and Whisper STT.

### Manual Configuration

```bash
# Set provider via config
wunderland config set voiceProvider openai
wunderland config set voiceModel tts-1
wunderland config set voiceVoice nova
wunderland config set sttProvider openai-whisper
wunderland config set sttModel whisper-1

# Or set environment variables
export OPENAI_API_KEY=sk-...          # OpenAI TTS + Whisper STT
export ELEVENLABS_API_KEY=...         # ElevenLabs TTS
export DEEPGRAM_API_KEY=...           # Deepgram STT
export WHISPER_LOCAL_BASE_URL=http://127.0.0.1:8080/v1  # Local OpenAI-compatible STT
```

---

## Supported Providers

### TTS (Text-to-Speech)

| Provider | Models | Voices | Key Required | Notes |
|----------|--------|--------|-------------|-------|
| **OpenAI TTS** | `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts` | nova, alloy, echo, onyx, fable, shimmer | `OPENAI_API_KEY` | Streaming, fast, good quality |
| **ElevenLabs** | `eleven_turbo_v2_5`, `eleven_multilingual_v2`, `eleven_monolingual_v1` | Custom + cloned | `ELEVENLABS_API_KEY` | Voice cloning, 29 languages |
| **Piper** | ONNX models (lessac, amy, alan, etc.) | Model-dependent | None | Free, offline, local |
| **macOS Say** | System voices | System-dependent | None | Built-in, no install needed |
| **Coqui TTS** | Various | Model-dependent | None | Open-source, local |
| **Azure TTS** | Neural voices | 400+ voices | `AZURE_SPEECH_KEY` | Enterprise-grade |

### STT (Speech-to-Text)

| Provider | Model | Key Required | Notes |
|----------|-------|-------------|-------|
| **OpenAI Whisper** | `whisper-1` | `OPENAI_API_KEY` | Batch transcription, word timestamps |
| **Deepgram** | `nova-2` | `DEEPGRAM_API_KEY` | Real-time streaming, punctuation, diarization |
| **Whisper.cpp** | base, small, medium, large-v3 | None | Free, offline, local |
| **Azure STT** | Various | `AZURE_SPEECH_KEY` | Enterprise-grade, real-time |
| **Vosk** | Various | None | Offline, lightweight |

### VAD (Voice Activity Detection)

| Provider | Notes |
|----------|-------|
| **Silero VAD** | Neural network-based, highly accurate |
| **WebRTC VAD** | Built-in, low latency |
| **Energy-based** | Simple threshold detection |

---

## Callable Voice Tools

Beyond the library API and CLI, Wunderland agents can call TTS and STT **as tools** during conversations. The `voice-synthesis` extension pack exposes two tools that any agent can invoke mid-turn.

### `text_to_speech` Tool

Converts text to audio. Auto-detects the best available provider from API keys.

**Provider resolution order:** `OPENAI_API_KEY` > `ELEVENLABS_API_KEY` > Ollama (local fallback)

```json
{
  "text": "Hello from your Wunderbot",
  "voice": "nova",
  "model": "tts-1-hd",
  "provider": "auto",
  "format": "mp3"
}
```

Returns `audioBase64` (base64-encoded audio), `contentType`, `provider`, `voice`, and `durationEstimateMs`.

**Voices by provider:**

| Provider | Available Voices |
|----------|-----------------|
| OpenAI | alloy, echo, fable, onyx, **nova** (default), shimmer |
| ElevenLabs | **rachel** (default), domi, bella, antoni, josh, arnold, adam, sam, or any custom voice ID |
| Ollama | Depends on loaded model |

### `speech_to_text` Tool

Transcribes audio using OpenAI Whisper, Deepgram, or a local OpenAI-compatible
Whisper runtime. Accepts base64 audio or a fetchable URL.

```json
{
  "audioBase64": "UklGRi...",
  "provider": "auto",
  "language": "en",
  "model": "whisper-1",
  "responseFormat": "verbose_json"
}
```

Returns `text`, `provider`, `model`, `language`, `durationSeconds`, and optional
`segments` with word-level timestamps or utterance groupings.

**Provider resolution order:** `OPENAI_API_KEY` > `DEEPGRAM_API_KEY` > explicitly configured `WHISPER_LOCAL_BASE_URL`

### Example: Agent Uses TTS in Conversation

```
User: Can you read this summary aloud?
Agent: Sure — let me synthesize the audio.
       [calls text_to_speech { text: "Q3 revenue grew 12%...", voice: "nova" }]
Agent: Here's the audio version of the summary.
       [returns audio/mpeg base64 payload to client]
```

The client receives the base64 audio in the tool result and can play it directly or save it.

### Example: HTTP API with Audio Response

```bash
# Start your agent server
wunderland start

# Send a message that triggers TTS
curl -X POST http://localhost:3777/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Read the last paragraph aloud using the shimmer voice"}'
```

The agent calls `text_to_speech` internally. The response `reply` field contains the agent's text, and the tool result (with `audioBase64`) is available in the conversation context.

### Configuring Provider Defaults

Set provider defaults via the CLI:

```bash
# Configure the voice-synthesis extension
wunderland extensions configure voice-synthesis

# Or set defaults directly
wunderland extensions set-default tts openai
wunderland extensions set-default stt openai
```

In `agent.config.json`, use `providerDefaults` to pin provider preferences:

```json
{
  "providerDefaults": {
    "tts": "elevenlabs",
    "stt": "openai"
  },
  "extensions": ["voice-synthesis"]
}
```

Or set the `TTS_PROVIDER` environment variable globally:

```bash
export TTS_PROVIDER=elevenlabs
export STT_PROVIDER=deepgram
```

---

## Library API

### Enable Voice in Your App

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
  },
});
```

### Text-to-Speech

```ts
const session = app.session();

// Simple synthesis
const audio = await session.speech.synthesize('Hello from Wunderland');

// With options
const audio = await session.speech.synthesize('Hello!', {
  provider: 'openai',
  model: 'tts-1-hd',
  voice: 'nova',
  speed: 1.0,
  format: 'mp3',
});

// Streaming synthesis
for await (const chunk of session.speech.synthesizeStream('A longer response...')) {
  process.stdout.write(chunk);
}
```

### Speech-to-Text

```ts
// Transcribe a file
const transcript = await session.speech.transcribe('./audio.wav');
console.log(transcript.text);

// With word timestamps
const result = await session.speech.transcribe('./audio.wav', {
  provider: 'openai-whisper',
  model: 'whisper-1',
  timestamps: true,
  language: 'en',
});

for (const word of result.words) {
  console.log(`${word.start}s - ${word.end}s: ${word.text}`);
}
```

### Full Voice Loop

```ts
// Listen → Transcribe → Process → Speak
const session = app.session();

// Start listening (VAD-aware)
session.speech.startListening({
  vad: 'silero',
  onSpeechStart: () => console.log('User speaking...'),
  onSpeechEnd: async (audio) => {
    const transcript = await session.speech.transcribe(audio);
    const response = await session.sendText(transcript.text);
    await session.speech.synthesize(response.text);
  },
});
```

---

## CLI Commands

```bash
# Check provider readiness
wunderland voice status

# List TTS providers and their configuration state
wunderland voice tts

# List STT providers and their configuration state
wunderland voice stt

# Synthesize a test phrase through your configured TTS
wunderland voice test "Hello from Wunderland"

# Voice cloning guidance (ElevenLabs)
wunderland voice clone
```

### Example Output

```
$ wunderland voice status

  Voice Runtime Status
  ────────────────────
  TTS Provider:  openai (tts-1, voice: nova)     ✓ ready
  STT Provider:  openai-whisper (whisper-1)       ✓ ready
  VAD:           silero                           ✓ loaded
  Telephony:     not configured
```

---

## Configuration Reference

### Config File (`~/.wunderland/config.json`)

```json
{
  "voiceProvider": "openai",
  "voiceModel": "tts-1",
  "voiceVoice": "nova",
  "sttProvider": "openai-whisper",
  "sttModel": "whisper-1"
}
```

### Per-Agent Config (`agent.config.json`)

```json
{
  "voice": {
    "tts": {
      "provider": "elevenlabs",
      "model": "eleven_turbo_v2_5",
      "voiceId": "custom-clone-id"
    },
    "stt": {
      "provider": "deepgram",
      "model": "nova-2"
    }
  }
}
```

### Environment Variables

```bash
# TTS
OPENAI_API_KEY=sk-...                # OpenAI TTS + Whisper
ELEVENLABS_API_KEY=...               # ElevenLabs TTS
OPENAI_TTS_DEFAULT_MODEL=tts-1      # Override TTS model
OPENAI_TTS_DEFAULT_VOICE=nova       # Override default voice

# STT
DEEPGRAM_API_KEY=...                 # Deepgram STT
WHISPER_MODEL_DEFAULT=base           # Whisper.cpp model size

# Azure (if used)
AZURE_SPEECH_KEY=...                 # Azure Speech Services
AZURE_SPEECH_REGION=eastus           # Azure region
```

---

## Provider Selection Guide

### Cloud vs Local

| Criterion | Cloud (OpenAI/ElevenLabs) | Local (Piper/Whisper.cpp) |
|-----------|--------------------------|--------------------------|
| Latency | ~200-500ms network RTT | ~50-200ms (hardware-dependent) |
| Quality | Highest | Good (model-dependent) |
| Privacy | Data sent to provider | Fully private |
| Cost | Per-token/character | Free |
| Offline | No | Yes |
| Setup | API key only | Binary install + model download |

### Recommended Stacks

**Best quality (cloud):**
- TTS: ElevenLabs `eleven_turbo_v2_5` — natural, expressive, cloning
- STT: OpenAI Whisper `whisper-1` — accurate, handles accents well

**Best value (cloud):**
- TTS: OpenAI `tts-1` — fast, 6 voices, reuses your LLM key
- STT: OpenAI Whisper `whisper-1` — same key

**Fully offline:**
- TTS: Piper `en_US-lessac-medium` — free, fast, decent quality
- STT: Whisper.cpp `small` — free, good accuracy/speed balance

**Hybrid:**
- TTS: ElevenLabs (production) + Piper (dev/testing fallback)
- STT: Deepgram nova-2 (real-time) + Whisper local (batch)

---

## Voice Cloning (ElevenLabs)

ElevenLabs supports voice cloning from audio samples:

```bash
# Get guidance on cloning setup
wunderland voice clone
```

Requirements:
- ElevenLabs Professional plan or higher
- Clean audio samples (30 seconds minimum, 3+ minutes recommended)
- No background noise or music

Once cloned, use the voice ID in your config:

```json
{
  "voiceProvider": "elevenlabs",
  "voiceModel": "eleven_turbo_v2_5",
  "voiceVoice": "your-cloned-voice-id"
}
```

---

## Troubleshooting

### "No voice provider configured"

Run `wunderland setup` or set config manually:
```bash
wunderland config set voiceProvider openai
```

### "TTS synthesis failed"

1. Check API key: `echo $OPENAI_API_KEY`
2. Test connectivity: `wunderland doctor`
3. Try a different model: `wunderland config set voiceModel tts-1`

### "STT transcription returned empty"

1. Verify audio format (WAV, MP3, M4A supported)
2. Check audio isn't silent: play it back locally
3. Try a larger Whisper model: `wunderland config set sttModel small`

### High Latency

1. Use streaming endpoints where available (`tts-1` supports streaming)
2. For local: use smaller models (`base` instead of `large-v3`)
3. Check network: `wunderland doctor` tests provider connectivity

---

## Next Steps

- [CLI Command Reference](/docs/api/cli-reference) — Full command surface
- [Voice Concierge Use Case](/docs/use-cases/voice-concierge) — Build a speech-enabled assistant
- [LLM Provider Setup](/docs/guides/model-providers) — Configure your LLM backend
- [Configuration](/docs/getting-started/configuration) — Full config reference
