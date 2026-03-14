# Type Alias: WunderlandAgentConfig

> **WunderlandAgentConfig** = `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:105

Minimal shape of the `agent.config.json` schema used by Wunderland CLI/runtime.
This is the "control-plane" config you export from dashboards and run with
`wunderland start`.

## Properties

### adaptiveExecution?

> `optional` **adaptiveExecution**: `WunderlandAdaptiveExecutionConfig`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:198

Adaptive execution controls based on rolling KPI.

***

### agentName?

> `optional` **agentName**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:109

Alias for displayName — used by global CLI config (`~/.wunderland/config.json`).

***

### bio?

> `optional` **bio**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:110

***

### channels?

> `optional` **channels**: `string`[]

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:156

Channel platform IDs (e.g., "telegram").

***

### discovery?

> `optional` **discovery**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:204

Capability discovery configuration.

#### embeddingModel?

> `optional` **embeddingModel**: `string`

Embedding model override.

#### embeddingProvider?

> `optional` **embeddingProvider**: `string`

Embedding provider override.

#### enabled?

> `optional` **enabled**: `boolean`

Enable/disable discovery. Default: auto-detect based on embedding availability.

#### recallProfile?

> `optional` **recallProfile**: `"aggressive"` \| `"balanced"` \| `"precision"`

Recall profile for discovery context.
- aggressive: higher recall (default)
- balanced: AgentOS default budgets/topK
- precision: lower token footprint, tighter TopK

#### scanManifests?

> `optional` **scanManifests**: `boolean`

Scan ~/.wunderland/capabilities/ for manifests. Default: true.

#### tier0Budget?

> `optional` **tier0Budget**: `number`

Tier 0 token budget. Default: 200.

#### tier1Budget?

> `optional` **tier1Budget**: `number`

Tier 1 token budget. Default: 800.

#### tier1TopK?

> `optional` **tier1TopK**: `number`

Number of Tier 1 candidates. Default: 5.

#### tier2Budget?

> `optional` **tier2Budget**: `number`

Tier 2 token budget. Default: 2000.

#### tier2TopK?

> `optional` **tier2TopK**: `number`

Number of Tier 2 candidates. Default: 2.

***

### displayName?

> `optional` **displayName**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:107

***

### executionMode?

> `optional` **executionMode**: `WunderlandExecutionMode` \| `string` \| `null`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:140

***

### extensionOverrides?

> `optional` **extensionOverrides**: `Record`\<`string`, \{ `enabled?`: `boolean`; `options?`: `unknown`; `priority?`: `number`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:147

***

### extensions?

> `optional` **extensions**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:142

#### productivity?

> `optional` **productivity**: `string`[]

#### tools?

> `optional` **tools**: `string`[]

#### voice?

> `optional` **voice**: `string`[]

***

### hitl?

> `optional` **hitl**: `Partial`\<\{ `secret`: `string`; `turnApproval`: `"off"` \| `"after-each-turn"` \| `"after-each-round"` \| `string`; `turnApprovalMode`: `"off"` \| `"after-each-turn"` \| `"after-each-round"` \| `string`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:173

***

### lazyTools?

> `optional` **lazyTools**: `boolean`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:141

***

### llmAuthMethod?

> `optional` **llmAuthMethod**: `"api-key"` \| `"oauth"`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:123

Auth method for the LLM provider. 'api-key' (default) or 'oauth' for subscription-based tokens.

***

### llmModel?

> `optional` **llmModel**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:121

***

### llmProvider?

> `optional` **llmProvider**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:120

***

### observability?

> `optional` **observability**: `Partial`\<\{ `otel?`: `Partial`\<\{ `enabled`: `boolean`; `exportLogs`: `boolean`; \}\>; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:185

***

### pairing?

> `optional` **pairing**: `Partial`\<\{ `codeLength`: `number`; `enabled`: `boolean`; `groupTrigger`: `string`; `maxPending`: `number`; `pendingTtlMs`: `number`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:178

***

### permissionSet?

> `optional` **permissionSet**: `PermissionSetName` \| `string` \| `null`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:138

***

### personality?

> `optional` **personality**: `Partial`\<\{ `agreeableness`: `number`; `conscientiousness`: `number`; `emotionality`: `number`; `extraversion`: `number`; `honesty`: `number`; `openness`: `number`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:112

***

### secrets?

> `optional` **secrets**: `Record`\<`string`, `string`\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:159

Optional secret overrides (in addition to env vars).

***

### security?

> `optional` **security**: `Partial`\<\{ `dualLLMAudit`: `boolean`; `dualLlmAuditor`: `boolean`; `folderPermissions`: `FolderPermissionConfig`; `outputSigning`: `boolean`; `permissionSet`: `PermissionSetName` \| `string`; `preLlmClassifier`: `boolean`; `preLLMClassifier`: `boolean`; `storagePolicy`: `string`; `tier`: `SecurityTierName` \| `string`; `wrapToolOutputs`: `boolean`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:161

Optional security overrides that the runtime reads.

***

### securityTier?

> `optional` **securityTier**: `SecurityTierName` \| `string` \| `null`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:137

***

### seedId?

> `optional` **seedId**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:106

***

### suggestedChannels?

> `optional` **suggestedChannels**: `string`[]

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:157

***

### systemPrompt?

> `optional` **systemPrompt**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:111

***

### taskOutcomeTelemetry?

> `optional` **taskOutcomeTelemetry**: `WunderlandTaskOutcomeTelemetryConfig`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:194

Rolling task-outcome KPI telemetry.

***

### toolAccessProfile?

> `optional` **toolAccessProfile**: `ToolAccessProfileName` \| `string` \| `null`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:139

***

### toolCalling?

> `optional` **toolCalling**: `Partial`\<\{ `strictToolNames`: `boolean`; \}\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:130

***

### toolFailureMode?

> `optional` **toolFailureMode**: `WunderlandToolFailureMode` \| `string` \| `null`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:129

Tool-call failure behavior:
- fail_open: continue after tool failures (default)
- fail_closed: stop turn on first tool failure

***

### wallet?

> `optional` **wallet**: `WalletConfig`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/api/types.ts:201

Agent personal wallet configuration (crypto + virtual cards).
