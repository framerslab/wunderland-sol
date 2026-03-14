---
title: Voice Concierge
sidebar_position: 3
---

# Voice Concierge

> Build a speech-enabled assistant that listens, understands, and speaks back.

---

## Overview

A voice concierge combines:
- **Speech-to-text** for understanding user speech
- **LLM processing** for generating intelligent responses
- **Text-to-speech** for speaking responses aloud
- **VAD** (voice activity detection) for knowing when the user is speaking

---

## Quick Start

```bash
# Enable voice during setup
wunderland setup
# Choose "Yes — use OpenAI" when prompted for voice

# Test voice
wunderland voice test "Welcome to your voice concierge!"

# Start with voice-enabled chat
wunderland chat
```

---

## Library Setup

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai' },
  preset: 'customer-support',
  extensions: {
    voice: ['speech-runtime'],
    tools: ['web-search'],
  },
});

const session = app.session();

// Voice interaction loop
session.speech.startListening({
  vad: 'silero',
  onSpeechStart: () => {
    console.log('Listening...');
  },
  onSpeechEnd: async (audioBuffer) => {
    // Transcribe
    const transcript = await session.speech.transcribe(audioBuffer);
    console.log(`User: ${transcript.text}`);

    // Process
    const response = await session.sendText(transcript.text);
    console.log(`Agent: ${response.text}`);

    // Speak
    await session.speech.synthesize(response.text, {
      voice: 'nova',
      model: 'tts-1',
    });
  },
});
```

---

## Configuration

### agent.config.json

```json
{
  "llmProvider": "openai",
  "llmModel": "gpt-4o-mini",
  "personalityPreset": "customer-support",
  "voice": {
    "tts": {
      "provider": "openai",
      "model": "tts-1",
      "voice": "nova"
    },
    "stt": {
      "provider": "openai-whisper",
      "model": "whisper-1"
    },
    "vad": {
      "provider": "silero",
      "sensitivity": 0.5
    }
  },
  "extensions": {
    "voice": ["speech-runtime"],
    "tools": ["web-search"]
  }
}
```

### Provider Stacks

**Low-latency cloud:**
```json
{
  "tts": { "provider": "openai", "model": "tts-1", "voice": "nova" },
  "stt": { "provider": "deepgram", "model": "nova-2" }
}
```
Deepgram offers real-time streaming STT, reducing perceived latency.

**Premium quality:**
```json
{
  "tts": { "provider": "elevenlabs", "model": "eleven_turbo_v2_5" },
  "stt": { "provider": "openai-whisper", "model": "whisper-1" }
}
```
ElevenLabs produces the most natural-sounding speech.

**Fully offline:**
```json
{
  "tts": { "provider": "piper", "model": "en_US-lessac-medium" },
  "stt": { "provider": "whisper-local", "model": "small" }
}
```
No internet or API keys needed.

---

## Use Cases

### Customer Support Bot

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  preset: 'customer-support',
  extensions: {
    voice: ['speech-runtime'],
    tools: ['web-search'],
  },
  skills: ['customer-support', 'faq-responder'],
});
```

The customer-support preset includes:
- Polite, helpful personality (high agreeableness, high conscientiousness)
- De-escalation patterns
- FAQ lookup via skills
- Handoff triggers for complex issues

### Meeting Assistant

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
  },
  rag: { enabled: true, mode: 'hybrid', autoIngest: true },
});

// Record and transcribe a meeting
const session = app.session();
const transcript = await session.speech.transcribe('./meeting-recording.wav', {
  timestamps: true,
  speakerDiarization: true,
});

// Generate meeting notes
const notes = await session.sendText(
  `Generate structured meeting notes from this transcript:\n${transcript.text}`
);
```

### Voice-Controlled Research

```ts
// Combine voice + research capabilities
const app = await createWunderland({
  llm: { providerId: 'openai' },
  extensions: {
    voice: ['speech-runtime'],
    tools: ['web-search', 'web-browser'],
  },
});

// "Hey, search for the latest React 19 features and tell me about them"
session.speech.startListening({
  onSpeechEnd: async (audio) => {
    const transcript = await session.speech.transcribe(audio);
    const response = await session.sendText(transcript.text);

    // Speak the response
    await session.speech.synthesize(response.text);
  },
});
```

---

## Optimizing Latency

For voice concierges, latency is critical. Here's how to minimize it:

### 1. Use Streaming

```ts
// Stream TTS output — start playing before full response is ready
for await (const chunk of session.speech.synthesizeStream(response.text)) {
  audioPlayer.write(chunk);
}
```

### 2. Choose Fast Models

| Component | Fast Option | Best Option |
|-----------|------------|-------------|
| LLM | `gpt-4o-mini` | `gpt-4o` |
| TTS | `tts-1` | `tts-1-hd` |
| STT | Deepgram `nova-2` | OpenAI Whisper |

### 3. Use VAD for Natural Conversation

```ts
session.speech.startListening({
  vad: 'silero',
  silenceTimeout: 1000,     // ms of silence before processing
  minSpeechDuration: 200,   // ignore very short sounds
});
```

### 4. Pre-warm the Pipeline

```ts
// Synthesize a short greeting to warm the TTS connection
await session.speech.synthesize('Ready.', { warmup: true });
```

---

## Deployment

### Local Development

```bash
wunderland start     # Start agent server
wunderland chat      # Connect with voice-enabled chat
```

### Web Application

The speech runtime works in browser environments via the WebSocket API:

```ts
// Client-side
const ws = new WebSocket('ws://localhost:3000/voice');

// Send audio chunks
mediaRecorder.ondataavailable = (e) => {
  ws.send(e.data);
};

// Receive synthesized audio
ws.onmessage = (e) => {
  audioPlayer.play(e.data);
};
```

---

## Next Steps

- **[Voice Runtime Guide](/docs/guides/voice-runtime)** — Full provider reference
- **[Voice Tutorial](/docs/tutorials/voice-agent)** — Step-by-step voice setup
- **[Deep Research Agent](/docs/use-cases/deep-research-agent)** — Add research capabilities
- **[Channels Guide](/docs/guides/channels)** — Connect to Discord, Slack, Telegram
