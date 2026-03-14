---
title: Channels
sidebar_position: 6
---

# Channels

Wunderland supports a large channel adapter catalog for messaging and social distribution. The exact adapter list lives in the curated channel registry, while operational configuration happens through setup/config.

## Typical Channel Flow

1. Choose the channels your agent actually needs.
2. Configure required secrets and OAuth where applicable.
3. Run `wunderland doctor` to confirm readiness.

## Good Practice

- start with one channel, not five
- keep side-effect channels behind approval-aware workflows
- separate operator-facing chat channels from public publishing channels

## Related Guides

- `wunderland help auth`
- [Extensions](./extensions)
- [Capability Discovery](./capability-discovery)
