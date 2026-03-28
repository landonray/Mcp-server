const crypto = require('crypto');
const express = require('express');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { createMcpServer } = require('./mcp/server');

const app = express();
app.use(express.json());

// Session store: sessionId → { transport, server, credentialHash, lastActivity }
const sessions = new Map();

// Session TTL: 30 minutes
const SESSION_TTL_MS = 30 * 60 * 1000;
// Cleanup interval: every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Hash credentials so we can verify returning sessions belong to the same account
 * without storing the raw credentials.
 */
function hashCredentials(apiKey, appId) {
  return crypto.createHash('sha256').update(`${apiKey}:${appId}`).digest('hex');
}

/**
 * Validate Api-Key and Api-Appid headers. Returns { apiKey, appId } or sends 401 and returns null.
 */
function validateAuth(req, res) {
  const apiKey = req.headers['api-key'];
  const appId = req.headers['api-appid'];

  if (!apiKey || !appId) {
    res.status(401).json({
      code: 401,
      error: 'unauthorized',
      message: 'Missing required headers: Api-Key and Api-Appid must both be provided.',
    });
    return null;
  }
  return { apiKey, appId };
}

/**
 * Look up an existing session and verify credentials match.
 * Returns the session or sends an error and returns null.
 */
function getVerifiedSession(req, res) {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    res.status(400).json({ code: 400, error: 'bad_request', message: 'Missing Mcp-Session-Id header.' });
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(400).json({ code: 400, error: 'bad_request', message: 'Invalid or expired session ID.' });
    return null;
  }

  // Verify credentials match the session
  const auth = validateAuth(req, res);
  if (!auth) return null;

  const hash = hashCredentials(auth.apiKey, auth.appId);
  if (hash !== session.credentialHash) {
    res.status(403).json({ code: 403, error: 'forbidden', message: 'Credentials do not match this session.' });
    return null;
  }

  // Update last activity
  session.lastActivity = Date.now();
  return session;
}

// ── Periodic session cleanup ──
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Don't let the timer prevent process exit
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

// ── Health check — no auth required ──
app.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── MCP Streamable HTTP: POST /v1 ──
app.post('/v1', async (req, res) => {
  const auth = validateAuth(req, res);
  if (!auth) return;

  const { apiKey, appId } = auth;
  const credentialHash = hashCredentials(apiKey, appId);

  // Check for existing session
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);

    // Verify credentials match the session
    if (session.credentialHash !== credentialHash) {
      return res.status(403).json({
        code: 403,
        error: 'forbidden',
        message: 'Credentials do not match this session.',
      });
    }

    session.lastActivity = Date.now();
    transport = session.transport;
  } else {
    // New session: create Server + Transport pair scoped to these credentials
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (newSessionId) => {
        sessions.set(newSessionId, {
          transport,
          server,
          credentialHash,
          lastActivity: Date.now(),
        });
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
  const session = getVerifiedSession(req, res);
  if (!session) return;

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
  const session = getVerifiedSession(req, res);
  if (!session) return;

  try {
    await session.transport.handleRequest(req, res);
    const sessionId = req.headers['mcp-session-id'];
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
