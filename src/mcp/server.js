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
const audit = require('../audit');

const SERVER_INFO = {
  name: 'ontraport-mcp-server',
  version: '1.0.0',
};

/**
 * Creates a configured MCP Server instance for a given set of Ontraport credentials.
 * Each session gets its own Server so credential context is isolated.
 */
function createMcpServer(apiKey, appId, { sessionId, credentialHash } = {}) {
  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools: {},
    },
  });

  // Cache the custom object map from the most recent tools/list call.
  let customObjectMap = new Map();

  // tools/list — build dynamic manifest from Ontraport account metadata
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const start = Date.now();
    try {
      const client = new OntraportClient(apiKey, appId);
      const result = await buildManifest(client);
      customObjectMap = result.customObjectMap;

      audit.logToolsList({
        sessionId,
        credentialHash,
        toolCount: result.tools.length,
        durationMs: Date.now() - start,
        status: 'success',
      });

      return { tools: result.tools };
    } catch (err) {
      audit.logToolsList({
        sessionId,
        credentialHash,
        toolCount: 0,
        durationMs: Date.now() - start,
        status: 'error',
        error: err.message,
      });
      throw err;
    }
  });

  // tools/call — dispatch to the appropriate tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const start = Date.now();
    const client = new OntraportClient(apiKey, appId);

    const handler = getHandler(name, customObjectMap);

    if (!handler) {
      audit.logToolCall({
        sessionId,
        credentialHash,
        tool: name,
        args,
        durationMs: Date.now() - start,
        status: 'error',
        error: `Unknown tool: ${name}`,
      });

      return {
        content: [{ type: 'text', text: JSON.stringify({ code: 400, error: 'bad_request', message: `Unknown tool: ${name}` }) }],
        isError: true,
      };
    }

    try {
      const result = await handler(client, args || {});
      const cleaned = cleanResponse(result);

      audit.logToolCall({
        sessionId,
        credentialHash,
        tool: name,
        args,
        durationMs: Date.now() - start,
        status: 'success',
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(cleaned, null, 2),
          },
        ],
      };
    } catch (err) {
      audit.logToolCall({
        sessionId,
        credentialHash,
        tool: name,
        args,
        durationMs: Date.now() - start,
        status: 'error',
        error: err instanceof McpError ? err.toJSON() : err.message,
      });

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
