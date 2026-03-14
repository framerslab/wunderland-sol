---
title: Scheduling & Workflows
sidebar_position: 8
---

# Scheduling & Workflows

> Automate agent tasks with cron-like scheduling, workflow pipelines, and event-driven triggers.

Wunderland supports scheduling agents to run tasks on a recurring basis — from simple cron jobs to multi-step workflow pipelines with conditions and branching.

---

## Quick Start

```bash
# Create a workflow
wunderland workflows create daily-report

# Schedule it to run weekdays at 9 AM
wunderland cron add "0 9 * * 1-5" daily-report

# List scheduled jobs
wunderland cron list

# Run a workflow manually
wunderland workflows run daily-report
```

---

## Workflows

A workflow is a named sequence of agent actions that can be triggered manually, on a schedule, or by events.

### Create a Workflow

```bash
wunderland workflows create <name>
```

This generates a `workflows/<name>.json` file in your agent project:

```json
{
  "name": "daily-report",
  "description": "Generate and distribute a daily summary report",
  "steps": [
    {
      "id": "research",
      "action": "web-search",
      "params": { "query": "latest news in {{topic}}" }
    },
    {
      "id": "summarize",
      "action": "chat",
      "params": { "prompt": "Summarize these findings into a report: {{research.output}}" }
    },
    {
      "id": "distribute",
      "action": "channel-post",
      "params": {
        "channel": "slack",
        "message": "{{summarize.output}}"
      }
    }
  ],
  "variables": {
    "topic": "AI and machine learning"
  }
}
```

### Workflow Steps

Each step has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique step identifier |
| `action` | string | Tool or capability to invoke |
| `params` | object | Parameters passed to the action |
| `condition` | string | Optional condition expression (skip if false) |
| `onError` | string | Error handling: `stop`, `skip`, `retry` |
| `retries` | number | Max retry attempts (default: 0) |

### Variable Interpolation

Use `{{variable}}` syntax to reference:
- Workflow variables: `{{topic}}`
- Previous step outputs: `{{research.output}}`
- Environment variables: `{{env.OPENAI_API_KEY}}`
- Date/time: `{{now}}`, `{{today}}`, `{{yesterday}}`

### Manage Workflows

```bash
# List all workflows
wunderland workflows list

# Show workflow details
wunderland workflows show daily-report

# Run a workflow manually
wunderland workflows run daily-report

# Run with variable overrides
wunderland workflows run daily-report --var topic="cryptocurrency"

# Delete a workflow
wunderland workflows delete daily-report
```

---

## Cron Scheduling

Schedule workflows to run automatically using cron expressions.

### Add a Schedule

```bash
wunderland cron add "<cron-expression>" <workflow-name>
```

### Cron Expression Format

```
┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * *
```

### Common Schedules

| Expression | Description |
|-----------|-------------|
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `0 */2 * * *` | Every 2 hours |
| `30 8 * * 1` | Monday at 8:30 AM |
| `0 0 1 * *` | First day of each month at midnight |
| `*/15 * * * *` | Every 15 minutes |
| `0 18 * * 5` | Friday at 6:00 PM |

### Manage Schedules

```bash
# List all scheduled jobs
wunderland cron list

# Remove a schedule
wunderland cron remove <job-id>

# Pause a schedule
wunderland cron pause <job-id>

# Resume a paused schedule
wunderland cron resume <job-id>
```

---

## Library API

### Create and Run Workflows Programmatically

```ts
import { createWunderland } from 'wunderland';

const app = await createWunderland({
  llm: { providerId: 'openai' },
  tools: 'curated',
});

// Define a workflow
const workflow = app.workflows.create({
  name: 'content-pipeline',
  steps: [
    {
      id: 'research',
      action: 'web-search',
      params: { query: 'Latest TypeScript features' },
    },
    {
      id: 'draft',
      action: 'chat',
      params: {
        prompt: 'Write a blog post based on: {{research.output}}',
      },
    },
  ],
});

// Run it
const result = await workflow.run();
console.log(result.steps.draft.output);
```

### Schedule with the API

```ts
// Schedule a workflow
app.scheduler.add({
  cron: '0 9 * * 1-5',
  workflow: 'content-pipeline',
  timezone: 'America/New_York',
});

// List active schedules
const jobs = app.scheduler.list();

// Cancel a schedule
app.scheduler.remove(jobId);
```

### Event-Driven Triggers

```ts
// Trigger workflow on channel events
app.on('channel:message', async (event) => {
  if (event.text.includes('!report')) {
    await app.workflows.run('daily-report', {
      variables: { topic: event.text.replace('!report ', '') },
    });
  }
});

// Trigger on schedule completion
app.on('workflow:complete', async (event) => {
  console.log(`Workflow ${event.name} completed in ${event.duration}ms`);
});
```

---

## Practical Examples

### Daily News Digest

```json
{
  "name": "news-digest",
  "steps": [
    {
      "id": "fetch",
      "action": "news-search",
      "params": { "topics": ["AI", "TypeScript", "open-source"] }
    },
    {
      "id": "summarize",
      "action": "chat",
      "params": {
        "prompt": "Create a concise news digest from these articles. Group by topic, include links."
      }
    },
    {
      "id": "post-slack",
      "action": "channel-post",
      "params": { "channel": "slack", "target": "#daily-digest" }
    }
  ]
}
```

### Weekly Analytics Report

```json
{
  "name": "weekly-analytics",
  "steps": [
    {
      "id": "gather",
      "action": "chat",
      "params": {
        "prompt": "Analyze the agent's performance this week: tool usage, response times, error rates."
      }
    },
    {
      "id": "visualize",
      "action": "chat",
      "params": {
        "prompt": "Format the analysis as a markdown report with tables and key metrics."
      }
    },
    {
      "id": "email",
      "action": "channel-post",
      "params": { "channel": "email", "to": "{{env.REPORT_EMAIL}}" }
    }
  ]
}
```

### Health Check Monitor

```bash
# Run diagnostics every 30 minutes
wunderland cron add "*/30 * * * *" health-check
```

```json
{
  "name": "health-check",
  "steps": [
    {
      "id": "check",
      "action": "doctor",
      "params": {}
    },
    {
      "id": "alert",
      "action": "channel-post",
      "condition": "{{check.hasErrors}}",
      "params": {
        "channel": "slack",
        "target": "#alerts",
        "message": "Agent health check failed: {{check.errors}}"
      }
    }
  ]
}
```

---

## Best Practices

1. **Start simple** — Begin with a single-step workflow, add complexity as needed
2. **Test manually first** — Always `wunderland workflows run <name>` before scheduling
3. **Use conditions** — Skip steps that aren't needed (e.g., only alert on errors)
4. **Set error handling** — Use `onError: "skip"` for non-critical steps
5. **Monitor with doctor** — `wunderland doctor` checks scheduler health
6. **Keep workflows idempotent** — Safe to re-run without side effects

---

## Next Steps

- [CLI Command Reference](/docs/api/cli-reference) — Full command surface
- [Extensions](/docs/guides/extensions) — Add tools for your workflows
- [Channels](/docs/guides/channels) — Connect messaging platforms for distribution
- [Creating Agents](/docs/guides/creating-agents) — Build agents that use workflows
