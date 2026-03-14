---
title: Creating Agents
sidebar_position: 1
---

# Creating Agents

There are three good ways to create a Wunderland agent.

## 1. Start From The CLI

```bash
wunderland init my-agent
cd my-agent
wunderland setup
```

Use this when you want:

- an operator-friendly local project
- a config file on disk
- a preset-driven starting point

## 2. Start From A Preset

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  preset: 'research-assistant',
});
```

Presets give you a coherent first pass across:

- tools
- skills
- personality defaults
- extension suggestions

## 3. Assemble The Agent Explicitly

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
  skills: ['web-search', 'summarize'],
  extensions: {
    tools: ['web-search', 'web-browser'],
    voice: ['speech-runtime'],
  },
});
```

Use this when you care about deterministic capability shape more than convenience.

## Recommended Creation Flow

1. Choose a preset close to your end state.
2. Add only the tools and skills you need.
3. Enable speech separately when the text workflow is stable.
4. Run `wunderland doctor` before handing the agent to other operators.

## Common Mistake

Do not treat skills and extensions as interchangeable:

- skills teach the model how and when to behave
- extensions load runtime code and tool/provider implementations
