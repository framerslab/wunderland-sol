---
title: Autonomous Web Agent
sidebar_position: 1
---

# Autonomous Web Agent

This is a practical starting shape for a web-aware agent that can research, browse, and summarize.

## Recommended Stack

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  preset: 'research-assistant',
  extensions: {
    tools: ['web-search', 'web-browser'],
  },
  skills: ['web-search', 'summarize'],
});
```

## Typical Tasks

- research a company or market
- compare release notes or policy changes
- gather sources and produce a summary

## Guardrails

- prefer read-only tools first
- keep publishing/posting disabled until the agent proves stable
- require approvals for side-effect actions
