---
title: Security & Approvals
sidebar_position: 10
---

# Security & Approvals

> Wunderland is safe-by-default. This guide covers execution modes, tool permissions, guardrails, and hardening.

---

## Security Model

Wunderland uses a multi-layered security pipeline:

```
User Input → Pre-LLM Classifier → LLM → Tool Call → Approval Gate → Execution → Dual-LLM Auditor → Output
```

Each layer is independently configurable. By default, all side-effect tools require human approval.

---

## Approval Modes

### deny-side-effects (default)

The safest mode. Read-only tools execute freely; anything that modifies state requires approval.

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  approvals: { mode: 'deny-side-effects' },
});
```

```bash
# CLI equivalent — this is the default
wunderland chat
```

### auto-all

Fully autonomous. All tool calls execute without asking. Use only in trusted environments.

```ts
approvals: { mode: 'auto-all' }
```

```bash
# CLI equivalents
wunderland chat --overdrive        # auto-approve (keeps security pipeline)
wunderland chat --auto-approve-tools  # fully autonomous (CI/demos)
```

### custom

Your code decides per-request. Best for production apps that need fine-grained control.

```ts
approvals: {
  mode: 'custom',
  handler: async (request) => {
    // Allow read-only tools
    if (request.tool.sideEffects === false) return { approved: true };
    // Auto-approve low-risk tools
    if (request.riskScore < 0.3) return { approved: true };
    // Require human approval for everything else
    return { approved: false, reason: 'Needs human review' };
  },
}
```

---

## CLI Security Flags

| Flag | Effect |
|------|--------|
| `--overdrive` | Auto-approve tool calls (security pipeline still active) |
| `--auto-approve-tools` | Fully autonomous tool execution |
| `--yes` | Auto-confirm setup/init prompts (not tool calls) |
| `--dangerously-skip-permissions` | Skip all permission checks |
| `--dangerously-skip-command-safety` | Disable shell command safety checks |

The `--dangerously-*` flags should only be used in development or CI. Never in production.

---

## Security Pipeline

### Pre-LLM Classifier

Screens user input before it reaches the LLM. Catches prompt injection, jailbreaks, and malicious inputs.

```ts
security: {
  preLlmClassifier: true,  // default: true
}
```

### Dual-LLM Auditor

A second model reviews the primary model's output for safety, accuracy, and policy compliance.

```ts
security: {
  dualLlmAuditor: true,    // default: true
}
```

The auditor uses the cheapest available model (e.g., `gpt-4o-mini`, `claude-haiku`) to minimize cost.

### Output Signing

Cryptographic provenance for agent outputs. Each response gets a signed hash for audit trails.

```ts
security: {
  outputSigning: true,     // default: true
}
```

### Risk Threshold

Controls how aggressively the classifier flags inputs. Lower = more sensitive.

```ts
security: {
  riskThreshold: 0.7,      // default: 0.7 (0.0 = block everything, 1.0 = allow everything)
}
```

---

## Security Tiers

Wunderland ships with 5 named security tiers for quick configuration:

| Tier | Pre-LLM | Auditor | Signing | Risk Threshold | Use Case |
|------|---------|---------|---------|---------------|----------|
| **dangerous** | Off | Off | Off | 1.0 | Dev/testing only |
| **permissive** | On | Off | Off | 0.9 | Low-risk internal tools |
| **balanced** | On | On | Off | 0.7 | General use (default) |
| **strict** | On | On | On | 0.5 | Production, customer-facing |
| **paranoid** | On | On | On | 0.3 | High-security environments |

### Apply a Tier

```bash
wunderland init my-agent --security-tier strict
```

Or in code:

```ts
const app = await createWunderland({
  llm: { providerId: 'openai' },
  security: { tier: 'strict' },
});
```

---

## Guardrails

### Content Filtering

The guardrails system filters content at both input and output stages:

- **PII Redaction** — Automatically detects and redacts personal information (emails, phone numbers, SSNs, credit cards)
- **Content Classification** — Flags toxic, harmful, or off-topic content
- **Domain Restrictions** — Limit the agent to specific topics or knowledge areas

### Filesystem Permissions

The CLI executor uses folder-level filesystem permissions:

```ts
const app = await createWunderland({
  extensions: {
    tools: ['cli-executor'],
  },
  // CLI executor options
  'cli-executor': {
    filesystem: {
      allowRead: true,
      allowWrite: true,
      readRoots: ['/home/user/workspace', '/tmp'],
      writeRoots: ['/home/user/workspace'],
    },
  },
});
```

Users can grant additional folder access at runtime via the `request_folder_access` tool.

### Tool Gating

Control which tools are available and under what conditions:

```ts
const app = await createWunderland({
  tools: {
    curated: {},
    allow: ['web-search', 'file-read'],    // whitelist
    deny: ['shell-exec', 'file-write'],     // blacklist
  },
});
```

---

## Hardening Checklist

For production deployments:

- [ ] Set security tier to `strict` or `paranoid`
- [ ] Enable all three pipeline stages (classifier, auditor, signing)
- [ ] Use `deny-side-effects` approval mode
- [ ] Restrict filesystem roots to necessary directories only
- [ ] Store API keys in environment variables, not config files
- [ ] Set `rag.autoIngest: false` if you don't want automatic fact extraction
- [ ] Review loaded extensions — only load what you need
- [ ] Use OpenTelemetry for observability: `wunderland setup` → enable OTEL
- [ ] Run `wunderland doctor` regularly

---

## Next Steps

- [Configuration](/docs/getting-started/configuration) — Full config reference
- [CLI Command Reference](/docs/api/cli-reference) — Security-related commands
- [Troubleshooting](/docs/guides/troubleshooting) — Common issues and fixes
