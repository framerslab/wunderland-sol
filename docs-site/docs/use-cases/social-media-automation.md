---
sidebar_position: 2
---

# Social Media Automation

Deploy an agent that manages your social media presence across Twitter/X, Instagram, Reddit, Pinterest, and TikTok — adapting content per platform, scheduling posts, and engaging with your audience autonomously.

## Prerequisites

- **Skills**: `social-broadcast`, `twitter-bot`, `instagram-bot`, `reddit-bot`, `content-creator`
- **Extensions**: `web-search`, `content-extraction`
- **Channel adapters**: Platform-specific (Twitter, Instagram, Reddit, etc.)
- **API keys**: Platform developer accounts

## Agent Configuration

```json
{
  "name": "Social Manager",
  "description": "Cross-platform social media automation agent",
  "hexacoTraits": {
    "honesty": 0.8,
    "emotionality": 0.5,
    "extraversion": 0.85,
    "agreeableness": 0.7,
    "conscientiousness": 0.8,
    "openness": 0.9
  },
  "securityTier": "balanced",
  "toolAccessProfile": "assistant",
  "suggestedSkills": [
    "social-broadcast",
    "twitter-bot",
    "instagram-bot",
    "reddit-bot",
    "content-creator"
  ],
  "suggestedChannels": ["twitter", "instagram", "reddit", "telegram"],
  "suggestedExtensions": {
    "tools": ["web-search", "content-extraction", "image-search"]
  }
}
```

:::tip Personality Matters
High extraversion (0.85) makes the agent post frequently and engage directly. High openness (0.9) enables creative cross-domain content. Adjust these traits to match your brand voice.
:::

## Architecture

```
┌──────────────────────────────────────────────┐
│              Content Pipeline                 │
├──────────────────────────────────────────────┤
│                                              │
│  SOURCE        → web-search, news, RSS       │
│  CREATE        → content-creator skill       │
│  ADAPT         → social-broadcast skill      │
│  PUBLISH       → channel adapters            │
│  ENGAGE        → platform-specific bots      │
│  ANALYZE       → RAG memory + reporting      │
│                                              │
└──────────────────────────────────────────────┘
```

## Cross-Platform Publishing

The `social-broadcast` skill takes a single piece of content and adapts it for each platform:

### Platform Adaptation

| Platform | Max Length | Format | Hashtags | Media |
|----------|-----------|--------|----------|-------|
| Twitter/X | 280 chars | Punchy, threaded | 1-3 inline | Optional |
| Instagram | 2,200 chars | Storytelling | 20-30 in comment | Required |
| Reddit | No limit | Descriptive title | None | Optional |
| Pinterest | 500 chars | Keyword-rich | In description | Required (vertical) |
| TikTok | 2,200 chars | Hook-first | 3-5 trending | Required (video) |

### Example Workflow

```bash
# Start with a topic or article
wunderland chat

> Take this article about autonomous AI agents and create posts for
  all my social channels. Schedule them for optimal engagement times.
  Twitter first, then Instagram 2 hours later, Reddit 4 hours later.
```

The agent will:
1. Extract key points from the article via `content-extraction`
2. Generate platform-specific content via `content-creator`
3. Adapt formatting via `social-broadcast`
4. Schedule via `wunderland cron`
5. Publish through channel adapters

## Scheduling Posts

Use the CronScheduler for recurring content:

```bash
# Schedule daily posts at optimal times
wunderland cron add --name "morning-post" \
  --schedule "0 9 * * *" \
  --task "Create and publish a morning update post across all channels"

# Schedule weekly content roundups
wunderland cron add --name "weekly-roundup" \
  --schedule "0 18 * * 5" \
  --task "Compile this week's top content and publish a roundup thread"
```

## Platform-Specific Bots

### Twitter/X Bot

The `twitter-bot` skill enables:
- Automated replies to mentions
- Thread creation from long-form content
- Trending topic engagement
- Quote-tweet with commentary
- Analytics tracking

```json
{
  "suggestedSkills": ["twitter-bot"],
  "twitterConfig": {
    "autoReply": true,
    "engageTrending": true,
    "threadOnLongContent": true,
    "maxDailyTweets": 20
  }
}
```

### Instagram Bot

The `instagram-bot` skill handles:
- Post scheduling with caption optimization
- Story creation
- Hashtag research and rotation
- Engagement with followers
- Reel descriptions

### Reddit Bot

The `reddit-bot` skill manages:
- Multi-subreddit posting
- Community-appropriate tone adaptation
- Comment engagement
- Karma-building through valuable contributions

## Content Generation

The `content-creator` skill generates SEO-optimized content:

```bash
wunderland chat

> Create a week's worth of social media content about
  browser automation for AI agents. Include:
  - 5 Twitter threads
  - 3 Instagram carousel ideas
  - 2 Reddit posts for r/MachineLearning
  - 1 long-form LinkedIn article
```

The agent uses `web-search` to research trending topics and `content-extraction` to analyze competitor content.

## Engagement Analytics

The agent tracks engagement via RAG memory:

```bash
# Query engagement data
wunderland chat

> What was my best performing content this week?
  Which platform had the highest engagement rate?
  What topics resonated most with my audience?
```

The agent stores all publishing activity and engagement metrics in its RAG memory, enabling trend analysis and content optimization over time.

## Multi-Account Management

Use the `account-manager` skill for managing multiple brand accounts:

```bash
# Import credentials for multiple accounts
wunderland chat

> Set up accounts for @brand_main and @brand_support on Twitter,
  and @brand on Instagram. Use the credentials from my vault.
```

Sessions are persisted in the encrypted credential vault, so the agent can switch between accounts without re-authentication.

## Security Considerations

- **Rate limits**: Each platform enforces API rate limits. The agent respects these automatically.
- **Content policies**: The `balanced` security tier filters content that could violate platform ToS.
- **Authentication**: All credentials stored encrypted in the credential vault.
- **Personality consistency**: HEXACO traits ensure consistent brand voice across platforms.

## Related Guides

- [Channels](/docs/guides/channels) — Setting up platform channel adapters
- [Skills System](/docs/guides/skills-system) — Available social automation skills
- [Scheduling](/docs/guides/scheduling) — Cron-based task scheduling
- [Style Adaptation](/docs/guides/style-adaptation) — How agents learn communication preferences
