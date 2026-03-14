---
title: "Tutorial: Add Voice to Your Agent"
sidebar_position: 2
---

# Tutorial: Add Voice to Your Agent

> Enable TTS and STT in 15 minutes — cloud or local, your choice.

This tutorial covers adding text-to-speech (TTS) and speech-to-text (STT) to an existing Wunderland agent.

---

## Prerequisites

- A working Wunderland agent (see [Build Your First Agent](/docs/tutorials/first-agent))
- One of:
  - An `OPENAI_API_KEY` (covers both TTS and Whisper STT)
  - An `ELEVENLABS_API_KEY` (premium TTS)
  - Local binaries: Piper (TTS) + Whisper.cpp (STT)

---

## Option A: OpenAI Voice (Fastest)

If you already use OpenAI as your LLM provider, voice is zero extra config.

### Step 1: Configure Voice

```bash
wunderland config set voiceProvider openai
wunderland config set voiceModel tts-1
wunderland config set voiceVoice nova
wunderland config set sttProvider openai-whisper
wunderland config set sttModel whisper-1
```

Or re-run `wunderland setup` — the wizard now includes voice in QuickStart mode and auto-detects your OpenAI key.

### Step 2: Test TTS

```bash
wunderland voice test "Hello! I can speak now."
```

You should hear audio output through your default system speaker.

### Step 3: Check Status

```bash
wunderland voice status
```

Expected output:
```
  TTS Provider:  openai (tts-1, voice: nova)     ✓ ready
  STT Provider:  openai-whisper (whisper-1)       ✓ ready
```

### Step 4: Try Different Voices

OpenAI offers 6 voices:

| Voice | Character |
|-------|-----------|
| `nova` | Female, clear and friendly |
| `alloy` | Neutral, balanced |
| `echo` | Male, warm |
| `onyx` | Male, deep and authoritative |
| `fable` | Neutral, storytelling |
| `shimmer` | Female, soft and gentle |

```bash
# Switch voice
wunderland config set voiceVoice echo
wunderland voice test "Now I sound different."
```

### Step 5: Try HD Quality

```bash
wunderland config set voiceModel tts-1-hd
wunderland voice test "This is higher quality audio."
```

The `tts-1-hd` model produces higher-fidelity audio at slightly higher latency.

---

## Option B: ElevenLabs Voice (Premium Quality)

ElevenLabs offers the highest quality TTS with voice cloning capabilities.

### Step 1: Get an API Key

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Go to Profile → API Keys
3. Create and copy your key

### Step 2: Configure

```bash
export ELEVENLABS_API_KEY=your-key-here
wunderland config set voiceProvider elevenlabs
wunderland config set voiceModel eleven_turbo_v2_5
```

### Step 3: Test

```bash
wunderland voice test "ElevenLabs voice synthesis is incredibly natural."
```

### Step 4: Pair with Whisper STT

ElevenLabs is TTS-only. For STT, pair it with OpenAI Whisper:

```bash
# If you have an OpenAI key
wunderland config set sttProvider openai-whisper
wunderland config set sttModel whisper-1
```

### Voice Cloning

ElevenLabs supports cloning your voice from audio samples:

```bash
wunderland voice clone
```

Requirements: ElevenLabs Professional plan, 30+ seconds of clean audio.

---

## Option C: Fully Local Voice (Free, Offline)

No API keys, no internet, no cost.

### Step 1: Install Piper (TTS)

```bash
# macOS
brew install piper

# Linux
# Download from https://github.com/rhasspy/piper/releases
```

### Step 2: Install Whisper.cpp (STT)

```bash
# macOS
brew install whisper-cpp

# Linux
# Download from https://github.com/ggerganov/whisper.cpp/releases
```

### Step 3: Configure

```bash
wunderland config set voiceProvider piper
wunderland config set voiceModel en_US-lessac-medium
wunderland config set sttProvider whisper-local
wunderland config set sttModel base
```

### Step 4: Test

```bash
wunderland voice test "I'm running completely locally!"
```

### Upgrading Quality

For better quality, use larger Whisper models:

```bash
# Better accuracy (slower)
wunderland config set sttModel small

# Best accuracy (requires more RAM)
wunderland config set sttModel medium
```

---

## Using Voice in Code

### Library API

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
  },
});

const session = app.session();

// Text-to-Speech
const audio = await session.speech.synthesize('Hello from Wunderland!', {
  voice: 'nova',
  model: 'tts-1',
});

// Speech-to-Text
const transcript = await session.speech.transcribe('./recording.wav');
console.log(transcript.text);

// Full voice loop
session.speech.startListening({
  onSpeechEnd: async (audio) => {
    const text = await session.speech.transcribe(audio);
    const response = await session.sendText(text.text);
    await session.speech.synthesize(response.text);
  },
});
```

### Agent Config

```json
{
  "voice": {
    "tts": {
      "provider": "openai",
      "model": "tts-1",
      "voice": "nova"
    },
    "stt": {
      "provider": "openai-whisper",
      "model": "whisper-1"
    }
  }
}
```

---

## Voice in the TUI

Open the TUI dashboard and press `v` for the voice panel:

```bash
wunderland
# Then press 'v'
```

The voice dashboard shows:
- Provider status (TTS, STT, VAD)
- Current configuration
- Quick actions (test, switch provider)

---

## Troubleshooting

### "No voice provider configured"

Run `wunderland setup` or set providers manually (see steps above).

### Audio plays but sounds wrong

- Switch to `tts-1-hd` for better quality
- Try a different voice (`wunderland config set voiceVoice alloy`)
- Check your system audio output device

### Piper/Whisper "command not found"

Ensure the binaries are on your PATH:
```bash
which piper
which whisper
```

### High latency

- Use `tts-1` (faster) instead of `tts-1-hd`
- For local: use `base` model instead of `large-v3`
- For cloud: check your network connection

---

## Provider Comparison

| Feature | OpenAI TTS | ElevenLabs | Piper |
|---------|-----------|------------|-------|
| Quality | Good | Excellent | Decent |
| Speed | Fast | Fast | Very fast |
| Cost | ~$0.015/1K chars | ~$0.30/1K chars | Free |
| Offline | No | No | Yes |
| Voice Cloning | No | Yes | No |
| Languages | ~50 | 29 | ~20 |
| Voices | 6 | Custom + cloned | Model-dependent |

---

## Next Steps

- **[Voice Runtime Guide](/docs/guides/voice-runtime)** — Full provider reference
- **[Voice Concierge Use Case](/docs/use-cases/voice-concierge)** — Build a full voice assistant
- **[CLI Reference](/docs/api/cli-reference)** — All voice commands
- **[Troubleshooting](/docs/guides/troubleshooting)** — More help
