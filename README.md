# Bright Data Web Agent

Ask a question about anything that lives on the public web and get an answer built from pages read a moment ago, with every source listed. The agent searches Google, Bing, or Yandex, opens the pages that matter, and reads them as clean Markdown — including the ones that return a CAPTCHA, a bot-detection wall, or a geo-block to an ordinary HTTP client. It ships with a `research-brief` workflow that returns the same research as structured JSON when something downstream needs to consume it. Built with Mastra and the Bright Data MCP server.

## Why we built this

Every agent that touches the web eventually hits the same wall. The built-in fetch tool works fine in development, then goes to production and starts returning CAPTCHA pages, 403s, and empty shells where the content used to be. The fix is rarely a better prompt — it is proxy rotation, browser fingerprinting, and retry logic, none of which is the thing you set out to build.

Bright Data already runs that infrastructure and exposes it over MCP, so an agent gets it as a set of tools. We wanted a starting point that makes the difference obvious: point this agent at a site that blocks everything else and watch the content come back.

## Features

- Answers from the live web with a source URL behind every claim, not from training data
- Reads pages that block ordinary scrapers — bot detection, CAPTCHAs, rate limits, and geo-restrictions are handled on every request
- Batches work, searching or reading up to ten pages in a single call
- Returns structured JSON through the `research-brief` workflow, ready for a database or an API response
- Adds platform-specific tools with one environment variable, for clean JSON from Amazon, LinkedIn, Crunchbase, and 60+ other sites without parsing HTML

## Quick start

### 1. Clone the template

Run:

```bash
npx create-mastra@latest --template https://github.com/danielshashko/template-bright-data-agent
cd template-bright-data-agent
```

### 2. Add your API keys

Copy the example environment file, then fill in the required values:

```bash
cp .env.example .env
```

- `BRIGHT_DATA_API_TOKEN` — every web request the agent makes runs through Bright Data. Create a token in your [account settings](https://brightdata.com/cp/setting/users). New accounts include 5,000 requests per month with no credit card.
- `OPENAI_API_KEY` — the model the agent runs on. Get one at [platform.openai.com](https://platform.openai.com/api-keys).

### 3. Start the dev server

```bash
npm run dev
```

Open [Mastra Studio](http://localhost:4111), select **Web Agent**, and ask: *"What does Bright Data's MCP server cost per 1,000 results, and what's included in the free tier? Read the pricing page, don't guess."* The agent searches, opens the pricing page, and answers from what it actually read, with the URL at the bottom.

Then run the **research-brief** workflow with a topic and watch the same research come back as typed JSON.

## Adding platform-specific tools

Out of the box the agent can search and read any page. Set `BRIGHT_DATA_MCP_GROUPS` in `.env` to swap in structured-data tools for a specific platform, which return clean JSON with no HTML parsing:

```bash
BRIGHT_DATA_MCP_GROUPS=ecommerce
```

| Group | What it adds |
|---|---|
| `ecommerce` | Amazon, Walmart, eBay, Best Buy, Etsy, Google Shopping |
| `social` | LinkedIn, Instagram, TikTok, YouTube, X, Reddit, Facebook |
| `business` | Crunchbase, ZoomInfo, Google Maps reviews, Zillow, Booking.com |
| `browser` | Remote browser automation — click, type, screenshot |
| `geo` | ChatGPT, Grok, and Perplexity answers as structured data |

With `ecommerce` enabled, "compare this laptop's price on Amazon, Walmart, and Best Buy" returns three structured product records instead of three pages of HTML.

Two things to know about the hosted server: it applies one group per connection, so a comma-separated list silently uses only the first entry, and enabling any group removes the `search_engine_batch` and `scrape_batch` tools. Leave the variable empty unless you need a particular platform.

## Making it yours

Swap the research prompt for the job you actually have. With `ecommerce` enabled and a list of competitor product URLs, the same agent becomes a price monitor that writes a row per product per day. With `business` and `social` enabled, it becomes a lead enricher that takes a company domain and returns funding, headcount, and current job postings.

The `research-brief` workflow is the pattern to copy when something downstream needs a guaranteed shape. Change `briefSchema` in [`src/mastra/workflows/research-brief.ts`](src/mastra/workflows/research-brief.ts) to the fields your database expects, and the workflow returns those instead.

## About Mastra templates

Mastra templates are ready-to-use projects that show what you can build with Mastra. Clone one, try it in Studio, and adapt it to your use case.

Want to contribute to this template? See [CONTRIBUTING.md](./CONTRIBUTING.md).
