const express = require('express');
const { handleRequest } = require('./handler');
const { unauthorized, McpError } = require('../errors');

const router = express.Router();

// Health check — no auth required
router.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// MCP Streamable HTTP transport
router.post('/v1', async (req, res) => {
  const apiKey = req.headers['api-key'];
  const appId = req.headers['api-appid'];

  if (!apiKey || !appId) {
    const err = unauthorized('Missing required headers: Api-Key and Api-Appid must both be provided.');
    return res.status(401).json(err.toJSON());
  }

  const jsonRpcRequest = req.body;

  if (!jsonRpcRequest || !jsonRpcRequest.jsonrpc || !jsonRpcRequest.method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: jsonRpcRequest?.id || null,
      error: { code: -32600, message: 'Invalid JSON-RPC request.' },
    });
  }

  try {
    const response = await handleRequest(jsonRpcRequest, apiKey, appId);

    // Notifications don't require a response
    if (response === null) {
      return res.status(204).send();
    }

    res.json(response);
  } catch (err) {
    if (err instanceof McpError) {
      if (err.code === 429 && err.retryAfter) {
        res.set('Retry-After', String(err.retryAfter));
      }
      return res.status(err.code).json(err.toJSON());
    }

    // Log error message only — never log full error objects which could contain credentials
    console.error('Unhandled MCP error:', err.message || 'Unknown error');
    return res.status(500).json({
      jsonrpc: '2.0',
      id: jsonRpcRequest?.id || null,
      error: { code: -32603, message: 'Internal server error.' },
    });
  }
});

module.exports = router;
