---
title: Capability Discovery
sidebar_position: 5
---

# Capability Discovery

Capability discovery keeps the active tool/skill surface smaller per turn by searching the available capability graph before exposing schemas to the model.

## Why It Matters

- lower token usage
- less tool confusion
- better precision for large capability sets

## Default

Wunderland defaults to aggressive recall because it is a safer general-purpose operator default than loading every possible tool into every turn.

```ts
discovery: {
  recallProfile: 'aggressive',
}
```

Other common profiles:

- `balanced`
- `precision`

## Practical Guidance

- use `aggressive` when you want recall and have many tools/skills loaded
- use `precision` when you want a tighter, smaller active surface
- override per turn only if you have a concrete reason to do so

## Interaction With Tools

Discovery narrows tool exposure. It does not change the installed capability set. If discovery finds nothing useful, Wunderland can fall back to broader tool exposure.
