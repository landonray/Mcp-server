const crypto = require('crypto');
const express = require('express');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { createMcpServer } = require('./mcp/server');

const app = express();
app.use(express.json());

// Session store: sessionId → { transport, server }
const sessions = new Map();

// ── Health check — no auth required ──
app.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── MCP Streamable HTTP: POST /v1 ──
app.post('/v1', async (req, res) => {
  // Validate credentials
  const apiKey = req.headers['api-key'];
  const appId = req.headers['api-appid'];

  if (!apiKey || !appId) {
    return res.status(401).json({
      code: 401,
      error: 'unauthorized',
      message: 'Missing required headers: Api-Key and Api-Appid must both be provided.',
    });
  }

  // Check for existing session
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && sessions.has(sessionId)) {
    transport = sessions.get(sessionId).transport;
  } else {
    // New session: create Server + Transport pair scoped to these credentials
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (newSessionId) => {
        sessions.set(newSessionId, { transport, server });
      },
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) sessions.delete(sid);
    };

    const server = createMcpServer(apiKey, appId);

    await server.connect(transport);
  }

  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    // Log error message only — never log full error objects which could contain credentials
    console.error('MCP request error:', err.message || 'Unknown error');
    if (!res.headersSent) {
      res.status(500).json({
        code: 500,
        error: 'server_error',
        message: 'An unexpected error occurred.',
      });
    }
  }
});

// ── MCP Streamable HTTP: GET /v1 (SSE stream for server notifications) ──
app.get('/v1', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const session = sessionId && sessions.get(sessionId);

  if (!session) {
    return res.status(400).json({
      code: 400,
      error: 'bad_request',
      message: 'Invalid or missing session ID.',
    });
  }

  try {
    await session.transport.handleRequest(req, res);
  } catch (err) {
    console.error('MCP SSE error:', err.message || 'Unknown error');
    if (!res.headersSent) {
      res.status(500).json({ code: 500, error: 'server_error', message: 'SSE stream error.' });
    }
  }
});

// ── MCP Streamable HTTP: DELETE /v1 (session termination) ──
app.delete('/v1', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const session = sessionId && sessions.get(sessionId);

  if (!session) {
    return res.status(400).json({
      code: 400,
      error: 'bad_request',
      message: 'Invalid or missing session ID.',
    });
  }

  try {
    await session.transport.handleRequest(req, res);
    sessions.delete(sessionId);
  } catch (err) {
    console.error('MCP session close error:', err.message || 'Unknown error');
    if (!res.headersSent) {
      res.status(500).json({ code: 500, error: 'server_error', message: 'Session close error.' });
    }
  }
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message || 'Unknown error');
  res.status(500).json({
    code: 500,
    error: 'server_error',
    message: 'An unexpected error occurred.',
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Ontraport MCP Server listening on port ${PORT}`);
  });
}

module.exports = app;
