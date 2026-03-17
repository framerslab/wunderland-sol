---
sidebar_position: 12
title: Library API
description: Programmatic API for embedding Wunderland agents in your applications
---

# Library-First API

The `createWunderland()` function is the recommended entry point for using Wunderland as a library. It provides a high-level session API with safe defaults, automatic config resolution, and built-in tool approval controls.

```bash
npm install wunderland
```

## Quick Start

```typescript
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai', model: 'gpt-4o' },
});

const session = app.session();
const result = await session.sendText('Explain quantum entanglement.');

console.log(result.text);           // Agent's response text
console.log(result.meta.elapsedMs); // Time taken
console.log(result.toolCalls);      // Tool invocations (if any)

await app.close();
```

## Configuration Options

`createWunderland()` accepts a `WunderlandOptions` object:

```typescript
type WunderlandOptions = {
  agentConfig?: WunderlandAgentConfig;  // Direct config object
  configPath?: string;                   // Path to agent.config.json
  workingDirectory?: string;             // Defaults to process.cwd()
  workspace?: Partial<WunderlandWorkspace>;
  llm?: {
    providerId?: string;   // 'openai' | 'anthropic' | 'openrouter' | 'ollama' | ...
    apiKey?: string;       // Falls back to env vars (OPENAI_API_KEY, etc.)
    model?: string;        // e.g. 'gpt-4o', 'claude-sonnet-4-6', 'llama3.1:8b'
    baseUrl?: string;      // Custom endpoint URL
    fallback?: LLMProviderConfig;
  };
  tools?: 'none' | 'curated' | {
    curated?: ToolRegistryConfig;
    custom?: ITool[];
  };
  approvals?: {
    mode?: 'deny-side-effects' | 'auto-all' | 'custom';
    onRequest?: (req: ToolApprovalRequest) => Promise<boolean>;
  };
  userId?: string;
  memory?: AgentMemory | ICognitiveMemoryManager;
  logger?: {
    debug?: (msg: string, meta?: unknown) => void;
    info?: (msg: string, meta?: unknown) => void;
    warn?: (msg: string, meta?: unknown) => void;
    error?: (msg: string, meta?: unknown) => void;
  };
};
```

### Optional Cognitive Memory Facade

If your app already owns an AgentOS cognitive memory manager, you can pass it to `createWunderland()` and read it back as a high-level `AgentMemory` facade:

```typescript
import { AgentMemory } from '@framers/agentos';
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai', model: 'gpt-4o' },
  memory: existingCognitiveMemoryManager,
});

await app.memory?.remember('User prefers terse answers');
const context = await app.memory?.getContext('user preferences', { tokenBudget: 1200 });
```

If you pass a raw `ICognitiveMemoryManager`, Wunderland wraps it with `AgentMemory.wrap()` automatically. If you pass an existing `AgentMemory` instance, Wunderland preserves it as-is.

### Config Resolution Order

1. Explicit `agentConfig` object (highest priority)
2. `configPath` pointing to an `agent.config.json` file
3. Auto-detected `agent.config.json` in the working directory
4. Sensible defaults

### LLM Resolution

API keys are resolved from multiple sources:

| Provider | Environment Variable | Fallback |
|----------|---------------------|----------|
| OpenAI | `OPENAI_API_KEY` | `OPENROUTER_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` | `OPENROUTER_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` | -- |
| Ollama | (no key needed) | -- |

If no usable LLM credentials are found, `createWunderland()` throws a `WunderlandConfigError` with actionable hints.

## Sessions

Each `app.session()` call creates an independent conversation with its own message history:

```typescript
const session1 = app.session();
const session2 = app.session('custom-session-id');

// Sessions are independent
await session1.sendText('Hello');
await session2.sendText('Bonjour');

// Access message history
const messages = session1.messages();
// [{ role: 'system', content: '...' }, { role: 'user', content: 'Hello' }, { role: 'assistant', content: '...' }]
```

### Turn Results

Every `sendText()` call returns a `WunderlandTurnResult`:

```typescript
type WunderlandTurnResult = {
  text: string;              // Final assistant response
  messages: WunderlandMessage[];  // Full conversation history
  toolCalls: ToolCallRecord[];    // All tool invocations this turn
  meta: {
    providerId: string;
    model: string;
    sessionId: string;
    elapsedMs: number;
  };
};
```

### Tool Call Records

Each tool invocation is tracked:

```typescript
type ToolCallRecord = {
  toolName: string;
  hasSideEffects: boolean;
  args: Record<string, unknown>;
  approved: boolean;
  toolResult?: string;      // Tool output as returned to the LLM
  deniedReason?: string;    // Why the tool was blocked (if applicable)
};
```

## Tool Approval Modes

Control which tools the agent can execute:

### `deny-side-effects` (default)

Read-only tools run automatically. Side-effect tools are denied.

```typescript
const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
  // Default: approvals.mode = 'deny-side-effects'
});
```

### `auto-all`

All tools run without approval. Use only in trusted/sandboxed environments.

```typescript
const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
  approvals: { mode: 'auto-all' },
});
```

### `custom`

Provide a callback to decide per-tool:

```typescript
const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
  approvals: {
    mode: 'custom',
    onRequest: async (req) => {
      console.log(`Tool: ${req.tool.name}, Side effects: ${req.tool.hasSideEffects}`);
      console.log(`Args: ${req.preview}`);
      // Return true to approve, false to deny
      return req.tool.name === 'web_search';
    },
  },
});
```

## Custom Tools

Add your own tools alongside (or instead of) the curated set:

```typescript
import type { ITool } from '@framers/agentos';

const weatherTool: ITool = {
  name: 'get_weather',
  description: 'Get current weather for a city',
  hasSideEffects: false,
  inputSchema: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
    },
    required: ['city'],
  },
  execute: async ({ city }) => {
    const data = await fetch(`https://api.weather.example/${city}`);
    return { result: await data.json() };
  },
};

const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: {
    curated: {},       // Include curated tools
    custom: [weatherTool],  // Plus your custom tools
  },
});
```

## Diagnostics

Inspect the resolved configuration:

```typescript
const diag = app.diagnostics();

console.log(diag.llm);
// { providerId: 'openai', model: 'gpt-4o', canUseLLM: true, openaiFallbackEnabled: false }

console.log(diag.tools);
// { count: 12, names: ['browser_navigate', 'web_search', ...], droppedByPolicy: [] }

console.log(diag.policy);
// { permissionSet: 'standard', toolAccessProfile: 'full', securityTier: 'balanced' }
```

## Error Handling

```typescript
import { createWunderland, WunderlandConfigError } from 'wunderland';

try {
  const app = await createWunderland({
    llm: { providerId: 'openai' },
  });
} catch (err) {
  if (err instanceof WunderlandConfigError) {
    console.error('Config error:', err.message);
    for (const issue of err.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
      if (issue.hint) console.error(`  Hint: ${issue.hint}`);
    }
  }
}
```

## Advanced Imports

For lower-level access, import from subpath modules:

```typescript
// All internals re-exported
import { createWunderlandSeed, WunderlandSecurityPipeline, ... } from 'wunderland/advanced';

// Individual modules
import { createWunderlandSeed, HEXACO_PRESETS } from 'wunderland/advanced/core';
import { WunderlandSecurityPipeline } from 'wunderland/advanced/security';
import { HierarchicalInferenceRouter } from 'wunderland/advanced/inference';
import { WonderlandNetwork, MoodEngine } from 'wunderland/advanced/social';
import { createWunderlandTools } from 'wunderland/tools';
import { SkillRegistry, loadSkillsFromDir } from 'wunderland/advanced/skills';
```

See the [API Overview](/docs/api/overview) for the full export map.

## Complete Example

```typescript
import { createWunderland } from 'wunderland';

async function main() {
  const app = await createWunderland({
    configPath: './agent.config.json',
    llm: {
      providerId: 'openai',
      model: 'gpt-4o',
    },
    tools: 'curated',
    approvals: {
      mode: 'custom',
      onRequest: async (req) => {
        // Allow web search but deny everything else with side effects
        return req.tool.name === 'web_search';
      },
    },
    logger: {
      info: (msg) => console.log(`[agent] ${msg}`),
      error: (msg) => console.error(`[agent] ${msg}`),
    },
  });

  // Check diagnostics
  const diag = app.diagnostics();
  console.log(`Using ${diag.llm.providerId}/${diag.llm.model} with ${diag.tools.count} tools`);

  // Run a multi-turn conversation
  const session = app.session();

  const r1 = await session.sendText('Search the web for the latest news about AI agents.');
  console.log(r1.text);
  console.log(`Tools used: ${r1.toolCalls.map(t => t.toolName).join(', ')}`);

  const r2 = await session.sendText('Summarize the top 3 results.');
  console.log(r2.text);

  await app.close();
}

main().catch(console.error);
```
