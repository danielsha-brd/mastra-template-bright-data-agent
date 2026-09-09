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
const token = process.env.BRIGHT_DATA_API_TOKEN;

if (!token) {
  throw new Error(
    'BRIGHT_DATA_API_TOKEN is not set. Get a free token at https://brightdata.com/cp/setting/users',
  );
}

const url = new URL('https://mcp.brightdata.com/mcp');
url.searchParams.set('token', token);

const group = process.env.BRIGHT_DATA_MCP_GROUPS?.trim();
if (group) {
  url.searchParams.set('groups', group);
}

export const brightData = new MCPClient({
  id: 'bright-data',
  servers: {
    // Tools arrive namespaced by this key, e.g. `brightData_search_engine`.
    brightData: {
      url,
      // Unblocking a protected page can take a while. Give it room.
      timeout: 120_000,
    },
  },
});

/**
 * Load the Bright Data tool set.
 *
 * A wrong or expired token does not fail the connection loudly — it comes back
 * with an empty tool list, which would leave the agent quietly answering from
 * memory instead of from the web. Treat that as a startup error.
 */
export async function loadBrightDataTools() {
  const tools = await brightData.listTools();

  if (Object.keys(tools).length === 0) {
    throw new Error(
      'Connected to the Bright Data MCP server but received no tools. This usually means BRIGHT_DATA_API_TOKEN is invalid or expired. Check it at https://brightdata.com/cp/setting/users',
    );
  }

  return tools;
}
