# Wunderland Docs Source

This directory holds the checked-in markdown source for `docs.wunderland.sh`.

## Scope

- `docs/` contains the curated guide, getting-started, architecture, deployment, and API overview pages.
- `docs/api-reference/` contains the generated TypeDoc markdown and typedoc sidebar export.
- `static/docs/_media/` contains long-form reference markdown and shared media assets used by the docs.

## Source Of Truth

The product/runtime truth lives in:

- `/Users/johnn/Documents/git/voice-chat-assistant/packages/wunderland/README.md`
- `/Users/johnn/Documents/git/voice-chat-assistant/packages/wunderland/docs/`
- `/Users/johnn/Documents/git/voice-chat-assistant/packages/wunderland/src/cli/`

When CLI commands, extensions, or runtime behavior change, update those sources first and then mirror the user-facing guidance here.

## Core Paths

- `docs/intro.md`
- `docs/getting-started/installation.md`
- `docs/getting-started/quickstart.md`
- `docs/getting-started/configuration.md`
- `docs/getting-started/agent-config-reference.md`
- `docs/api/overview.md`
- `docs/api/cli-reference.md`
- `docs/guides/`

## Notes

This repo snapshot previously retained generated build artifacts without the authored guide markdown. The files in `docs/` re-establish a maintained source path for onboarding, guides, and examples.
