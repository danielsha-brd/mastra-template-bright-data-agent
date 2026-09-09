# Bright Data Web Agent

Ask a question about anything that lives on the public web and get an answer built from pages read a moment ago, with every source listed. The agent searches Google, Bing, or Yandex, opens the pages that matter, and reads them as clean Markdown, including the ones that return a CAPTCHA, a bot-detection wall, or a geo-block to an ordinary HTTP client. It ships with a `research-brief` workflow that returns the same research as structured JSON when something downstream needs to consume it. Built with Mastra and the Bright Data MCP server.

## Why we built this

Every agent that touches the web eventually hits the same wall. The built-in fetch tool works fine in development, then goes to production and starts returning CAPTCHA pages, 403s, and empty shells where the content used to be. The fix is rarely a better prompt. It is proxy rotation, browser fingerprinting, and retry logic, none of which is the thing you set out to build.

Bright Data already runs that infrastructure and exposes it over MCP, so an agent gets it as a set of tools. We wanted a starting point that makes the difference obvious: point this agent at a site that blocks everything else and watch the content come back.

On the Mastra side the template shows how to wire a hosted MCP server into an agent, resolve its tools lazily so a missing key does not stop the server from booting, and hand the same agent to a workflow that pins the output to a schema.

## Demo

This demo runs in Mastra Studio, but you can connect this workflow to your React, Next.js, or Vue app using the [Mastra Client SDK](https://mastra.ai/docs/server/mastra-client) or agentic UI libraries like [AI SDK UI](https://mastra.ai/guides/build-your-ui/ai-sdk-ui), [CopilotKit](https://mastra.ai/guides/build-your-ui/copilotkit), or [Assistant UI](https://mastra.ai/guides/build-your-ui/assistant-ui).

## Features

- Answers from the live web with a source URL behind every claim, not from training data
- Reads pages that block ordinary scrapers, with bot detection, CAPTCHAs, rate limits, and geo-restrictions handled on every request
- Batches work, searching or reading up to ten pages in a single call
- Returns structured JSON through the `research-brief` workflow, ready for a database or an API response
- Adds platform-specific tools with one environment variable, for clean JSON from Amazon, LinkedIn, Crunchbase, and more than 20 other sites without parsing HTML

## Prerequisites

- [OpenAI API key](https://platform.openai.com/api-keys): used by default, but you can swap in any model
- [Bright Data API token](https://brightdata.com/cp/setting/users): powers every web request the agent makes. New accounts include 5,000 requests per month with no credit card.

## Quickstart 🚀

1. **Clone the template**
   - Run `npx create-mastra@latest --template bright-data-agent` to scaffold the project locally.
2. **Add your API keys**
   - Copy `.env.example` to `.env` and fill in your keys.
3. **Start the dev server**
   - Run `npm run dev` and open [localhost:4111](http://localhost:4111) to try it out.

Select **Web Agent** in Studio and point it at a page that fights scrapers:

> Read https://www.amazon.com/dp/B0BDHWDR12 and tell me the current price, the star rating, and the complaint that comes up most in the reviews.

Amazon is one of the sites that rate-limits and CAPTCHAs scrapers hardest, so a plain fetch of that URL is a coin toss that gets worse with volume. Every request the agent makes goes out through Bright Data's unblocking layer, so the product page comes back the same way on the first call and the thousandth.

Then run the **research-brief** workflow with a topic and watch the same research come back as typed JSON.

## Adding platform-specific tools

Out of the box the agent can search and read any page. Set `BRIGHT_DATA_MCP_GROUPS` in `.env` to swap in structured-data tools for a specific platform, which return clean JSON with no HTML parsing:

```bash
BRIGHT_DATA_MCP_GROUPS=ecommerce
```

| Group | What it adds |
|---|---|
| `ecommerce` | Amazon, Walmart, eBay, Best Buy, Etsy, Home Depot, Zara, Google Shopping |
| `social` | LinkedIn, Instagram, TikTok, YouTube, X, Reddit, Facebook |
| `business` | Crunchbase, ZoomInfo, Google Maps reviews, Zillow, Booking.com |
| `browser` | Remote browser automation: navigate, click, type, scroll, screenshot |
| `geo` | ChatGPT, Grok, and Perplexity answers as structured data |

With `ecommerce` enabled, "compare this laptop's price on Amazon, Walmart, and Best Buy" returns three structured product records instead of three pages of HTML.

Three things to know about the hosted server:

- It applies one group per connection, so a comma-separated list silently uses only the first entry.
- Enabling any group removes the `search_engine_batch` and `scrape_batch` tools.
- A group name it does not recognize is ignored without an error, and you get the default search and scrape tools back. If your platform tools are missing, check the spelling first.

Leave the variable empty unless you need a particular platform.

## Making it yours

Swap the research prompt for the job you actually have. With `ecommerce` enabled and a list of competitor product URLs, the same agent becomes a price monitor that writes a row per product per day. With `business` and `social` enabled, it becomes a lead enricher that takes a company domain and returns funding, headcount, and current job postings.

The `research-brief` workflow is the pattern to copy when something downstream needs a guaranteed shape. Change `briefSchema` in [`src/mastra/workflows/research-brief.ts`](src/mastra/workflows/research-brief.ts) to the fields your database expects, and the workflow returns those instead.

If all you need is search and page fetching, and you would rather have typed tools than a live MCP connection, Mastra also ships [`@mastra/brightdata`](https://mastra.ai/integrations/tools/brightdata), which wraps the Bright Data SDK as two `createTool()` tools. It trades the batch tools and the platform groups above for a smaller surface, and it expects Bright Data zones to be configured on your account.

## About Mastra templates

[Mastra templates](https://mastra.ai/templates) are ready-to-use projects that show off what you can build, clone one, poke around, and make it yours. They live in the [Mastra monorepo](https://github.com/mastra-ai/mastra) and are automatically synced to standalone repositories for easier cloning.

Want to contribute? See [CONTRIBUTING.md](./CONTRIBUTING.md).
