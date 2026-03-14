---
title: CLI Operations Guide
sidebar_position: 2
---

# CLI Operations Guide

This page is the practical operator guide. For the command list itself, see the [CLI Command Reference](../api/cli-reference).

## Typical Daily Loop

```bash
wunderland doctor
wunderland start
wunderland chat
```

## High-Value Commands

- `wunderland setup` for first-time configuration
- `wunderland help <topic>` for short built-in guidance
- `wunderland skills` and `wunderland extensions` for capability inspection
- `wunderland models` for provider/model status
- `wunderland voice ...` for speech-runtime checks and smoke tests

## TUI Notes

If you launch `wunderland` in a TTY with no subcommand, it opens the TUI dashboard. That is the best entry point for operators who prefer:

- interactive status views
- searchable lists
- guided navigation
- help overlays and tours

## Useful Help Topics

```bash
wunderland help getting-started
wunderland help tui
wunderland help auth
wunderland help voice
wunderland help presets
```
