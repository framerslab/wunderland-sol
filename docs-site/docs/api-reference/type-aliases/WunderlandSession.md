# Type Alias: WunderlandSession

> **WunderlandSession** = `object`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:231

## Properties

### id

> `readonly` **id**: `string`

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:232

***

### messages()

> **messages**: () => [`WunderlandMessage`](WunderlandMessage.md)[]

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:233

#### Returns

[`WunderlandMessage`](WunderlandMessage.md)[]

***

### sendText()

> **sendText**: (`text`, `opts?`) => `Promise`\<[`WunderlandTurnResult`](WunderlandTurnResult.md)\>

Defined in: apps/wunderland-sh/docs-site/.source/wunderland/src/public/index.ts:234

#### Parameters

##### text

`string`

##### opts?

###### tenantId?

`string`

###### toolFailureMode?

`WunderlandToolFailureMode`

###### toolSelectionMode?

`TurnToolSelectionMode`

###### userId?

`string`

#### Returns

`Promise`\<[`WunderlandTurnResult`](WunderlandTurnResult.md)\>
