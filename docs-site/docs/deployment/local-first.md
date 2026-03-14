---
title: Local-First Deployment
sidebar_position: 1
---

# Local-First Deployment

Wunderland works well as a local-first stack:

- local config files
- local CLI/TUI operations
- optional Ollama for local inference
- optional local speech providers when installed
- selective cloud providers only where you actually need them

## Suggested Local-First Stack

- Ollama for local chat models
- local filesystem config and agent manifests
- local-only tools plus a small curated extension set
- optional local speech adapters for offline STT/TTS

## Hybrid Model

Many teams still start hybrid:

- OpenAI or Anthropic for primary LLM turns
- cloud speech for quickest setup
- local Ollama or local speech adapters later as cost/privacy needs harden

## Recommended Sequence

1. Get the CLI/TUI and base agent working.
2. Turn on only the extensions you need.
3. Add speech runtime support after core chat flow is stable.
4. Move providers local one surface at a time.
