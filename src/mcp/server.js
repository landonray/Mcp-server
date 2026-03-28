const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const { buildManifest } = require('../manifest/builder');
const { getHandler } = require('../tools/registry');
const { cleanResponse } = require('../ontraport/response-cleaner');
const { OntraportClient } = require('../ontraport/client');
const { McpError } = require('../errors');

const SERVER_INFO = {
  name: 'ontraport-mcp-server',
  version: '1.0.0',
};

/**
 * Creates a configured MCP Server instance for a given set of Ontraport credentials.
 * Each session gets its own Server so credential context is isolated.
 */
function createMcpServer(apiKey, appId) {
  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools: {},
    },
  });

  // tools/list — build dynamic manifest from Ontraport account metadata
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const client = new OntraportClient(apiKey, appId);
    const tools = await buildManifest(client);
    return { tools };
  });

  // tools/call — dispatch to the appropriate tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const client = new OntraportClient(apiKey, appId);

    const handler = await getHandler(name, client);

    if (!handler) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ code: 400, error: 'bad_request', message: `Unknown tool: ${name}` }) }],
        isError: true,
      };
    }

    try {
      const result = await handler(client, args || {});
      const cleaned = cleanResponse(result);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(cleaned, null, 2),
          },
        ],
      };
    } catch (err) {
      if (err instanceof McpError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(err.toJSON(), null, 2),
            },
          ],
          isError: true,
        };
      }
      throw err;
    }
  });

  return server;
}

module.exports = { createMcpServer, SERVER_INFO };
