# Type Alias: WunderlandOptions

> **WunderlandOptions** = `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:131

## Properties

### adaptiveExecution?

> `optional` **adaptiveExecution**: `WunderlandAdaptiveExecutionConfig`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:228

Runtime adaptive execution controls.

***

### agentConfig?

> `optional` **agentConfig**: [`WunderlandAgentConfig`](WunderlandAgentConfig.md)

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:133

Direct config object (control-plane).

***

### approvals?

> `optional` **approvals**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:199

#### mode?

> `optional` **mode**: [`WunderlandApprovalsMode`](WunderlandApprovalsMode.md)

Default: 'deny-side-effects'

#### onRequest()?

> `optional` **onRequest**: (`req`) => `Promise`\<`boolean`\>

Called only for side-effect tools when mode='custom'.
Return true to allow execution.

##### Parameters

###### req

[`ToolApprovalRequest`](ToolApprovalRequest.md)

##### Returns

`Promise`\<`boolean`\>

***

### configPath?

> `optional` **configPath**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:135

Optional path to `agent.config.json` (resolved relative to workingDirectory).

***

### discovery?

> `optional` **discovery**: `WunderlandDiscoveryConfig`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:217

Capability discovery configuration.

***

### extensions?

> `optional` **extensions**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:189

Extension sources (merged with preset extensions if both provided).
Extensions are resolved from `@framers/agentos-extensions-registry`.

#### overrides?

> `optional` **overrides**: `Record`\<`string`, \{ `enabled?`: `boolean`; `options?`: `unknown`; `priority?`: `number`; \}\>

Per-extension overrides (enabled, priority, options).

#### productivity?

> `optional` **productivity**: `string`[]

Productivity extension names (e.g. ['google-calendar']).

#### tools?

> `optional` **tools**: `string`[]

Tool extension names (e.g. ['web-search', 'web-browser', 'giphy']).

#### voice?

> `optional` **voice**: `string`[]

Speech runtime extension names (e.g. ['speech-runtime']).

***

### llm?

> `optional` **llm**: `Partial`\<\{ `apiKey`: `string`; `baseUrl?`: `string`; `fallback?`: `LLMProviderConfig`; `model`: `string`; `providerId`: [`WunderlandProviderId`](WunderlandProviderId.md) \| `string`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:141

LLM configuration (apiKey/model default from env when omitted).

***

### logger?

> `optional` **logger**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:210

#### debug()?

> `optional` **debug**: (`msg`, `meta?`) => `void`

##### Parameters

###### msg

`string`

###### meta?

`unknown`

##### Returns

`void`

#### error()?

> `optional` **error**: (`msg`, `meta?`) => `void`

##### Parameters

###### msg

`string`

###### meta?

`unknown`

##### Returns

`void`

#### info()?

> `optional` **info**: (`msg`, `meta?`) => `void`

##### Parameters

###### msg

`string`

###### meta?

`unknown`

##### Returns

`void`

#### warn()?

> `optional` **warn**: (`msg`, `meta?`) => `void`

##### Parameters

###### msg

`string`

###### meta?

`unknown`

##### Returns

`void`

***

### preset?

> `optional` **preset**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:167

Load a preset by ID — auto-configures tools, skills, extensions, and personality.
Preset values are merged with explicit `tools`, `skills`, and `extensions` options
(explicit options take precedence).

#### Example

```ts
preset: 'research-assistant'
```

***

### skills?

> `optional` **skills**: `"all"` \| `string`[] \| \{ `dirs?`: `string`[]; `includeDefaults?`: `boolean`; `names?`: `string`[]; \}

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:174

Skill sources (merged with preset skills if both provided):
- `'all'`: all curated skills for the current platform
- `string[]`: skill names from the curated registry
- object: fine-grained control over skill loading

#### Type Declaration

`"all"`

`string`[]

\{ `dirs?`: `string`[]; `includeDefaults?`: `boolean`; `names?`: `string`[]; \}

#### dirs?

> `optional` **dirs**: `string`[]

Additional skill directories to scan.

#### includeDefaults?

> `optional` **includeDefaults**: `boolean`

Scan default dirs (./skills, ~/.codex/skills) — default: true.

#### names?

> `optional` **names**: `string`[]

Curated skill names to load.

***

### taskOutcomeTelemetry?

> `optional` **taskOutcomeTelemetry**: `WunderlandTaskOutcomeTelemetryConfig`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:226

Runtime task-outcome telemetry controls.

***

### toolCalling?

> `optional` **toolCalling**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:219

Tool-calling behavior controls.

#### strictToolNames?

> `optional` **strictToolNames**: `boolean`

Enforce strict OpenAI function names and fail when rewrites/collisions are needed.

***

### toolFailureMode?

> `optional` **toolFailureMode**: `WunderlandToolFailureMode`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:224

Default tool-call failure behavior.

***

### tools?

> `optional` **tools**: `"none"` \| `"curated"` \| \{ `curated?`: `ToolRegistryConfig`; `custom?`: `ITool`[]; \}

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:154

Tool sources:
- 'none': no tools (pure chat)
- 'curated': curated tool packs (requires optional deps)
- object: curated + custom tools

***

### userId?

> `optional` **userId**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:209

Optional default userId for guardrails/audit context.

***

### workingDirectory?

> `optional` **workingDirectory**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:137

Defaults to `process.cwd()`

***

### workspace?

> `optional` **workspace**: `Partial`\<[`WunderlandWorkspace`](WunderlandWorkspace.md)\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:139

Workspace location for tool execution state.
