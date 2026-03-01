---
sidebar_position: 4
---

# Lead Generation Pipeline

Build a multi-agent pipeline that scrapes leads from the web, enriches contact data, and conducts personalized outreach via email, SMS, or messaging channels — all running autonomously.

## Prerequisites

- **Skills**: `web-scraper`, `account-manager`, `content-creator`
- **Extensions**: `browser-automation`, `content-extraction`, `web-search`
- **Channels**: `email`, `sms`, `whatsapp`, or `telegram`
- **Optional**: Proxy rotation service, 2Captcha API key

## Architecture: Multi-Agent Agency

This use case benefits from the Agency system — multiple specialized agents coordinating via a shared communication bus.

```
┌────────────────────────────────────────────────────┐
│                 Agency: Lead Pipeline               │
├────────────────────────────────────────────────────┤
│                                                    │
│  Agent 1: PROSPECTOR                               │
│  ├── web-scraper skill                             │
│  ├── browser-automation extension                  │
│  └── Searches directories, extracts lead data      │
│                                                    │
│  Agent 2: ENRICHER                                 │
│  ├── deep-research skill                           │
│  ├── content-extraction extension                  │
│  └── Enriches leads with company/social data       │
│                                                    │
│  Agent 3: OUTREACH                                 │
│  ├── content-creator skill                         │
│  ├── email/sms/whatsapp channels                   │
│  └── Sends personalized messages, tracks replies   │
│                                                    │
│              Communication Bus                     │
│  Prospector → Enricher → Outreach → Report         │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Agent Configurations

### Agent 1: Prospector

```json
{
  "name": "Lead Prospector",
  "description": "Scrapes web directories for lead data",
  "hexacoTraits": {
    "honesty": 0.8,
    "emotionality": 0.1,
    "extraversion": 0.2,
    "agreeableness": 0.4,
    "conscientiousness": 0.95,
    "openness": 0.6
  },
  "securityTier": "permissive",
  "suggestedSkills": ["web-scraper", "account-manager"],
  "suggestedExtensions": {
    "tools": ["browser-automation", "content-extraction", "web-search"]
  }
}
```

### Agent 2: Enricher

```json
{
  "name": "Lead Enricher",
  "description": "Enriches leads with company and social data",
  "hexacoTraits": {
    "honesty": 0.9,
    "emotionality": 0.2,
    "extraversion": 0.3,
    "agreeableness": 0.5,
    "conscientiousness": 0.9,
    "openness": 0.85
  },
  "securityTier": "balanced",
  "suggestedSkills": ["deep-research", "web-scraper"],
  "suggestedExtensions": {
    "tools": ["content-extraction", "web-search"]
  }
}
```

### Agent 3: Outreach

```json
{
  "name": "Outreach Agent",
  "description": "Sends personalized outreach and tracks responses",
  "hexacoTraits": {
    "honesty": 0.85,
    "emotionality": 0.4,
    "extraversion": 0.8,
    "agreeableness": 0.75,
    "conscientiousness": 0.85,
    "openness": 0.7
  },
  "securityTier": "balanced",
  "suggestedSkills": ["content-creator"],
  "suggestedChannels": ["email", "sms", "whatsapp"]
}
```

## Setting Up the Agency

```bash
# Create the agency
wunderland agency create lead-pipeline

# Add agents
wunderland agency add-agent lead-pipeline --config prospector.config.json
wunderland agency add-agent lead-pipeline --config enricher.config.json
wunderland agency add-agent lead-pipeline --config outreach.config.json

# Start the pipeline
wunderland agency start lead-pipeline
```

## Pipeline Stages

### Stage 1: Prospecting

The Prospector agent navigates business directories, extracts contact information:

```bash
wunderland chat --agent prospector

> Search Google Maps for marketing agencies in Austin, TX.
  Extract: company name, website, phone, email, address,
  rating, number of reviews. Get the first 200 results.
```

The agent uses `browserNavigate` → `browserFill` (search) → `browserExtract` (results) → `browserScroll` (pagination) in a loop.

### Stage 2: Enrichment

The Enricher agent receives raw leads and adds context:

- Visit company website → extract services, team size, tech stack
- Check LinkedIn → company page data
- Search news → recent press coverage
- Social media → presence and activity level
- Calculate lead score based on criteria

### Stage 3: Outreach

The Outreach agent sends personalized messages:

```bash
wunderland chat --agent outreach

> For each lead scored above 7/10, send a personalized email
  introducing our AI automation services. Reference something
  specific from their website. Follow up in 3 days if no reply.
  Send me a daily summary on Telegram.
```

The agent:
1. Generates personalized content using `content-creator`
2. Sends via the `email` channel adapter
3. Tracks opens/replies in RAG memory
4. Schedules follow-ups via `wunderland cron`
5. Reports daily via Telegram

## Data Tracking

All lead data is stored in the agent's RAG memory:

```bash
wunderland chat

> Show me all leads from Austin that haven't responded yet.
  What's our overall response rate? Which message template
  performed best?
```

The agent queries structured data from its memory store, providing analytics on:
- Total leads found
- Leads contacted
- Response rate by channel
- Best-performing message templates
- Follow-up status

## Scheduling the Pipeline

Run the full pipeline on a schedule:

```bash
# Daily prospecting run
wunderland cron add --name "daily-prospect" \
  --schedule "0 6 * * *" \
  --task "Find 50 new leads matching our ideal customer profile"

# Follow-up check
wunderland cron add --name "follow-ups" \
  --schedule "0 10 * * *" \
  --task "Send follow-ups to leads that haven't responded in 3 days"

# Weekly report
wunderland cron add --name "weekly-report" \
  --schedule "0 17 * * 5" \
  --task "Compile weekly lead generation report and send to Slack"
```

## Security Considerations

:::warning
Lead generation involves contacting real people. Always ensure compliance with anti-spam laws (CAN-SPAM, GDPR, etc.).
:::

- **Consent**: Only contact businesses with publicly listed contact information
- **Opt-out**: Include unsubscribe/opt-out in every message
- **Rate limiting**: Don't send more than 50 emails/day from a single address
- **Data privacy**: Store PII securely in the credential vault
- **Compliance**: The `balanced` security tier includes content filtering

## Related Guides

- [Autonomous Web Agent](/docs/use-cases/autonomous-web-agent) — Browser automation basics
- [Browser Automation](/docs/guides/browser-automation) — Low-level API reference
- [Channels](/docs/guides/channels) — Email, SMS, WhatsApp setup
- [Scheduling](/docs/guides/scheduling) — Cron-based automation
