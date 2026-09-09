import { MCPClient } from '@mastra/mcp';

/**
 * Bright Data runs a hosted MCP server, so there is nothing to install and no
 * proxy or headless browser to maintain. You connect to one URL with your token.
 *
 * With no groups configured, the agent gets search and scraping:
 *   search_engine            Google, Bing, or Yandex results as structured data
 *   search_engine_batch      up to 10 searches in one call
 *   scrape_as_markdown       any URL as clean Markdown
 *   scrape_batch             up to 10 URLs in one call
 *   ask_brightdata_assistant delegate an open-ended web question
 *
 * Set BRIGHT_DATA_MCP_GROUPS to swap in platform-specific tools instead.
 * Note: the hosted server applies one group, and setting a group drops the
 * two batch tools, so leave it empty unless you need a specific platform.
 */
const token = process.env.BRIGHT_DATA_API_TOKEN?.trim();

function buildUrl(apiToken: string) {
  const url = new URL('https://mcp.brightdata.com/mcp');
  url.searchParams.set('token', apiToken);

  const group = process.env.BRIGHT_DATA_MCP_GROUPS?.trim();
  if (group) {
    url.searchParams.set('groups', group);
  }

  return url;
}

/**
 * The server is only registered when a token is present. Without it the client
 * has no servers, `listTools()` returns `{}`, and the app still starts, so
 * `mastra dev` opens and tells you what is missing instead of crashing on
 * import with a stack trace.
 */
export const brightData = new MCPClient({
  id: 'bright-data',
  servers: token
    ? {
        // Tools arrive namespaced by this key, e.g. `brightData_search_engine`.
        brightData: {
          url: buildUrl(token),
          // Unblocking a protected page can take a while. Give it room.
          timeout: 120_000,
        },
      }
    : {},
});

const MISSING_TOKEN =
  'BRIGHT_DATA_API_TOKEN is not set, so the agent has no web tools and will answer from memory. Get a free token at https://brightdata.com/cp/setting/users';

const REJECTED_TOKEN =
  'Connected to the Bright Data MCP server but received no tools, so the agent will answer from memory. This usually means BRIGHT_DATA_API_TOKEN is invalid or expired. Check it at https://brightdata.com/cp/setting/users';

type BrightDataTools = Awaited<ReturnType<typeof brightData.listTools>>;

let toolsPromise: Promise<BrightDataTools> | undefined;

/**
 * Load the Bright Data tool set, once, on first use.
 *
 * A wrong or expired token does not fail the connection loudly, it comes back
 * with an empty tool list, which would leave the agent quietly answering from
 * memory instead of from the web. That case is worth shouting about, so it is
 * logged as an error even though it does not stop the server.
 */
export async function loadBrightDataTools() {
  toolsPromise ??= (async () => {
    if (!token) {
      console.error(MISSING_TOKEN);
      return {} as BrightDataTools;
    }

    try {
      const tools = await brightData.listTools();

      if (Object.keys(tools).length === 0) {
        console.error(REJECTED_TOKEN);
      }

      return tools;
    } catch (error) {
      console.error(
        `Could not reach the Bright Data MCP server, so the agent has no web tools: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {} as BrightDataTools;
    }
  })();

  return toolsPromise;
}
