# Type Alias: WunderlandDiagnostics

> **WunderlandDiagnostics** = `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:92

## Properties

### approvals

> **approvals**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:101

#### mode

> **mode**: [`WunderlandApprovalsMode`](WunderlandApprovalsMode.md)

***

### discovery?

> `optional` **discovery**: `WunderlandDiscoveryStats`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:119

***

### llm

> **llm**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:93

#### baseUrl?

> `optional` **baseUrl**: `string`

#### canUseLLM

> **canUseLLM**: `boolean`

#### model

> **model**: `string`

#### openaiFallbackEnabled

> **openaiFallbackEnabled**: `boolean`

#### providerId

> **providerId**: [`WunderlandProviderId`](WunderlandProviderId.md)

***

### policy

> **policy**: `NormalizedRuntimePolicy`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:100

***

### skills

> **skills**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:110

#### count

> **count**: `number`

#### names

> **names**: `string`[]

***

### tools

> **tools**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:104

#### availability?

> `optional` **availability**: `Record`\<`string`, \{ `available`: `boolean`; `reason?`: `string`; \}\>

#### count

> **count**: `number`

#### droppedByPolicy

> **droppedByPolicy**: `object`[]

#### names

> **names**: `string`[]

***

### workspace

> **workspace**: `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:114

#### agentId

> **agentId**: `string`

#### baseDir

> **baseDir**: `string`

#### workingDirectory

> **workingDirectory**: `string`
