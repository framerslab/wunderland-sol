---
sidebar_position: 16
---

# Stealth Browser (Anti-Bot Detection)

Standard headless browsers get blocked. Amazon returns CAPTCHAs. LinkedIn serves login walls. eBay shows blank pages. These sites fingerprint `navigator.webdriver`, check for missing Chrome runtime objects, and detect headless user agents.

The stealth browser extension wraps `puppeteer-extra` with the `puppeteer-extra-plugin-stealth` plugin to bypass these checks. It presents as a real browser session — complete with spoofed plugins, valid Chrome runtime, and rotated user agents.

## Anti-Detection Features

The stealth plugin applies several evasion techniques automatically:

- **`navigator.webdriver` removal** — Headless Chrome sets `navigator.webdriver = true`. Stealth deletes it.
- **Chrome runtime injection** — Sites check for `window.chrome.runtime`. Stealth injects a convincing stub.
- **User agent rotation** — Each session gets a real-world desktop user agent string, not the default HeadlessChrome UA.
- **Plugin and MIME type spoofing** — `navigator.plugins` returns a realistic plugin list instead of an empty array.
- **WebGL vendor masking** — GPU renderer strings match real hardware profiles.
- **Iframe contentWindow patching** — Prevents cross-frame detection of automation.

## Tools

The extension provides six tools:

| Tool | Description |
|------|-------------|
| `stealth_navigate` | Navigate to a URL with full anti-detection |
| `stealth_scrape` | Extract page content (text, HTML, or structured data) |
| `stealth_click` | Click elements by CSS selector |
| `stealth_type` | Type text into form fields |
| `stealth_screenshot` | Capture a screenshot of the current page |
| `stealth_snapshot` | Get the full DOM snapshot for analysis |

## Enabling

```bash
wunderland extensions enable stealth-browser
```

No API keys required. The extension uses Chromium bundled with Puppeteer.

Or add it to your `agent.config.json`:

```json
{
  "extensions": {
    "tools": ["stealth-browser"]
  }
}
```

## When to Use Which Browser Tool

Wunderland ships three ways to fetch web content. Pick the right one:

| Tool | Use When | Speed | Detection Risk |
|------|----------|-------|---------------|
| `web_search` | You need search results, not a specific page | Fast | None (uses search API) |
| `browser_navigate` | The target site doesn't block bots (docs, wikis, public APIs) | Medium | Moderate |
| `stealth_navigate` | The site actively blocks headless browsers (Amazon, eBay, LinkedIn, etc.) | Slower | Low |

Start with `browser_navigate`. If it fails with a bot detection error or returns empty content, switch to `stealth_navigate`. The agent can learn this pattern automatically (see below).

## Automatic Failure Recovery

When `browser_navigate` fails on a bot-protected site, two systems kick in:

### ToolFailureLearner

The ToolFailureLearner detects anti-bot failures (empty responses, CAPTCHA markers, 403 status codes) and records a lesson into the agent's RAG memory:

```
"browser_navigate failed on amazon.com due to anti-bot detection.
Use stealth_navigate for this domain."
```

On future queries involving that domain, RAG surfaces the lesson and the agent uses `stealth_navigate` from the start.

### Agent Auto-Suggestion

Even without stored lessons, the agent's system prompt includes fallback guidance: if `browser_navigate` returns an error mentioning "bot", "captcha", or "access denied", retry with `stealth_navigate`. No configuration needed.

## Example Session

```
You: Scrape the price of the Sony WH-1000XM5 on Amazon

Agent: I'll check Amazon for that product.
       [uses stealth_navigate → amazon.com/dp/B0BX5...]
       [uses stealth_scrape → extracts price element]

       The Sony WH-1000XM5 is currently listed at $278.00 on Amazon.
```

## Limitations

- **JavaScript-heavy SPAs** — Some sites load content via complex JS frameworks. The stealth browser waits for `networkidle0` by default, but extremely dynamic pages may need explicit wait selectors.
- **CAPTCHAs** — Stealth avoids triggering most CAPTCHAs, but sites with aggressive bot detection (e.g., Cloudflare Turnstile on highest settings) may still challenge the browser.
- **Rate limiting** — Rapid sequential requests to the same domain can trigger IP-based blocks regardless of stealth. Space requests naturally in conversation.
- **Session persistence** — Each `stealth_navigate` call starts a fresh browser context. Cookies and login state do not persist across calls.
