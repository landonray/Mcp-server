const { buildManifest } = require('../manifest/builder');
const { getHandler } = require('../tools/registry');
const { cleanResponse } = require('../ontraport/response-cleaner');
const { OntraportClient } = require('../ontraport/client');
const { badRequest, McpError } = require('../errors');

const SERVER_INFO = {
  name: 'ontraport-mcp-server',
  version: '1.0.0',
};

const CAPABILITIES = {
  tools: {},
};

async function handleRequest(jsonRpcRequest, apiKey, appId) {
  const { method, params, id } = jsonRpcRequest;

  switch (method) {
    case 'initialize':
      return jsonRpcResponse(id, {
        protocolVersion: '2024-11-05',
        serverInfo: SERVER_INFO,
        capabilities: CAPABILITIES,
      });

    case 'notifications/initialized':
      // Client acknowledgment, no response needed
      return null;

    case 'tools/list': {
      const tools = await handleToolsList(apiKey, appId);
      return jsonRpcResponse(id, { tools });
    }

    case 'tools/call': {
      const result = await handleToolCall(apiKey, appId, params);
      return jsonRpcResponse(id, result);
    }

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

async function handleToolsList(apiKey, appId) {
  const client = new OntraportClient(apiKey, appId);
  const manifest = await buildManifest(client);
  return manifest;
}

async function handleToolCall(apiKey, appId, params) {
  if (!params || !params.name) {
    throw badRequest('Missing tool name in tools/call request.');
  }

  const { name, arguments: args } = params;
  const client = new OntraportClient(apiKey, appId);

  // getHandler is async — resolves custom object tools via /objects/meta if needed
  const handler = await getHandler(name, client);

  if (!handler) {
    throw badRequest(`Unknown tool: ${name}`);
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
}

function jsonRpcResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function jsonRpcError(id, code, message) {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  };
}

module.exports = { handleRequest };
