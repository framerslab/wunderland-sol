---
sidebar_position: 3
---

# Deep Research Agent

Build an agent that conducts multi-source investigations — crawling academic papers, news, social media, and the web — then synthesizes findings into structured reports delivered via your preferred channel.

## Prerequisites

- **Skills**: `deep-research`, `web-scraper`, `summarize`
- **Extensions**: `deep-research`, `content-extraction`, `web-search`, `news-search`
- **Channels**: `email`, `slack`, `discord`, or `telegram` (for report delivery)
- **Optional**: Serper API key (for enhanced search), Brave API key

## Agent Configuration

```json
{
  "name": "Research Analyst",
  "description": "Multi-source research agent with fact-checking",
  "hexacoTraits": {
    "honesty": 0.95,
    "emotionality": 0.2,
    "extraversion": 0.3,
    "agreeableness": 0.6,
    "conscientiousness": 0.98,
    "openness": 0.85
  },
  "securityTier": "balanced",
  "toolAccessProfile": "assistant",
  "suggestedSkills": ["deep-research", "web-scraper", "summarize"],
  "suggestedExtensions": {
    "tools": [
      "deep-research",
      "content-extraction",
      "web-search",
      "news-search"
    ]
  }
}
```

:::tip Why High Conscientiousness?
At 0.98, the agent triple-checks claims, cross-references sources, and flags contradictions. This is critical for research accuracy.
:::

## Research Pipeline

```
┌─────────────────────────────────────────────┐
│             Research Pipeline                │
├─────────────────────────────────────────────┤
│                                             │
│  1. SCOPE     → Define research question    │
│  2. SEARCH    → Multi-engine web search     │
│  3. ACADEMIC  → arXiv, Scholar, Semantic    │
│  4. NEWS      → Google News, HN, Reddit     │
│  5. EXTRACT   → Content extraction + clean  │
│  6. ANALYZE   → Cross-reference + verify    │
│  7. SYNTHESIZE→ Structured report           │
│  8. DELIVER   → Channel (email, Slack, etc) │
│  9. STORE     → RAG memory for follow-up    │
│                                             │
└─────────────────────────────────────────────┘
```

## Example: Technology Landscape Analysis

```bash
wunderland chat

> Research the current state of autonomous AI agents in 2026.
  Cover: major frameworks, adoption trends, security concerns,
  regulatory landscape. Check arXiv for recent papers, scan
  HackerNews and Reddit for community sentiment, and review
  news coverage. Send me a report on Slack when done.
```

The agent will autonomously:

1. **Search** across multiple engines (Serper, Brave, DuckDuckGo)
2. **Scan academic sources** — arXiv, Google Scholar, Semantic Scholar
3. **Monitor social** — Reddit (r/MachineLearning, r/artificial), HackerNews
4. **Extract content** from each source, cleaning HTML to structured text
5. **Cross-reference** claims across sources, flagging contradictions
6. **Generate report** with executive summary, key findings, source citations
7. **Deliver** via Slack channel with formatted markdown
8. **Store** all findings in RAG memory for future queries

## Multi-Source Investigation

The `deep-research` extension provides:

### Academic Paper Search

```bash
# Search arXiv, Google Scholar, Semantic Scholar simultaneously
wunderland chat

> Find all papers published in the last 6 months about
  prompt injection attacks on autonomous agents.
  Summarize key findings and defensive techniques.
```

### Trend Detection

```bash
# Monitor trending topics across platforms
wunderland chat

> What are the trending discussions about AI safety
  on Twitter, Reddit, and HackerNews this week?
  Identify emerging concerns and community sentiment.
```

### Fact-Checking

The agent cross-references claims from multiple sources:

```
Claim: "GPT-5 achieves 95% on MMLU"
├── Source 1 (arXiv): Confirmed — paper cites 94.8%
├── Source 2 (news): Partially confirmed — says "over 94%"
├── Source 3 (Reddit): Unverified — user claim without citation
└── Verdict: HIGH CONFIDENCE — multiple independent sources agree
```

## Scheduled Research

Set up recurring research tasks:

```bash
# Daily news digest
wunderland cron add --name "ai-digest" \
  --schedule "0 8 * * *" \
  --task "Compile today's top AI news from arXiv, HackerNews, \
          and Reddit. Send digest to Slack #research channel."

# Weekly competitive analysis
wunderland cron add --name "competitor-watch" \
  --schedule "0 9 * * 1" \
  --task "Research competitor activity: product launches, \
          blog posts, social media. Compare to last week."
```

## RAG Memory for Knowledge Accumulation

Every research session builds on previous knowledge:

```bash
wunderland chat

> What did we learn about prompt injection defenses
  from last week's research? Has anything changed?
```

The agent queries its RAG memory (vector + graph stores) to find relevant prior research, then focuses new investigation on gaps and updates.

### Knowledge Graph

The agent builds entity relationships from research:

```
[Prompt Injection] --DEFENDED_BY--> [Input Sanitization]
[Prompt Injection] --DEFENDED_BY--> [Dual-LLM Auditing]
[Dual-LLM Auditing] --IMPLEMENTED_BY--> [Wunderland]
[Wunderland] --FORK_OF--> [OpenClaw]
```

## Report Delivery

Reports are delivered via your configured channel:

### Slack

```bash
wunderland channels add slack
# Configure webhook URL or OAuth token
```

### Email

```bash
wunderland channels add email
# Configure SMTP settings
```

### Discord

```bash
wunderland channels add discord
# Configure bot token and channel ID
```

Reports include:
- Executive summary (2-3 paragraphs)
- Key findings (numbered list)
- Source citations with links
- Confidence levels per claim
- Recommended follow-up questions

## Security Considerations

- **Source verification**: The agent evaluates source credibility (academic > news > social)
- **Bias detection**: High honesty (0.95) trait makes the agent flag potential bias
- **Rate limiting**: Searches are rate-limited to avoid being blocked
- **Data retention**: Research data stored in RAG memory follows your retention policies

## Related Guides

- [Browser Automation](/docs/guides/browser-automation) — For web content extraction
- [Skills System](/docs/guides/skills-system) — Custom research skills
- [Channels](/docs/guides/channels) — Report delivery channels
- [Scheduling](/docs/guides/scheduling) — Recurring research tasks
