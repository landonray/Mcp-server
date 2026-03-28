const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.MCP_LOG_DIR || path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.jsonl');

// Ensure log directory exists
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // ignore if it already exists or can't be created
}

/**
 * Write a JSON-lines audit log entry.
 * Each line is a self-contained JSON object with:
 *   timestamp, event, sessionId, tool, durationMs, status, error
 *
 * Credentials are NEVER logged — only the credential hash.
 */
function log(entry) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  }) + '\n';

  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // If we can't write the log, don't crash the server
  }
}

function logToolCall({ sessionId, credentialHash, tool, args, durationMs, status, error }) {
  log({
    event: 'tool_call',
    sessionId: sessionId || null,
    credentialHash: credentialHash || null,
    tool,
    args: sanitizeArgs(args),
    durationMs,
    status, // 'success' | 'error'
    error: error || null,
  });
}

function logToolsList({ sessionId, credentialHash, toolCount, durationMs, status, error }) {
  log({
    event: 'tools_list',
    sessionId: sessionId || null,
    credentialHash: credentialHash || null,
    toolCount,
    durationMs,
    status,
    error: error || null,
  });
}

function logSession({ event, sessionId, credentialHash }) {
  log({
    event, // 'session_created' | 'session_expired' | 'session_closed' | 'session_auth_failed'
    sessionId: sessionId || null,
    credentialHash: credentialHash || null,
  });
}

function logAuthFailure({ reason, ip }) {
  log({
    event: 'auth_failure',
    reason,
    ip: ip || null,
  });
}

/**
 * Strip sensitive values from tool arguments before logging.
 * Logs field names and types but redacts actual values for
 * fields that could contain PII or financial data.
 */
function sanitizeArgs(args) {
  if (!args || typeof args !== 'object') return args;

  const sensitive = new Set([
    'ccnumber', 'code', 'expire_month', 'expire_year',
    'cctoken', 'payer', 'billing_address',
  ]);

  const sanitized = {};
  for (const [key, value] of Object.entries(args)) {
    if (sensitive.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = Array.isArray(value)
        ? `[Array(${value.length})]`
        : `{Object(${Object.keys(value).join(',')})}`;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = {
  log,
  logToolCall,
  logToolsList,
  logSession,
  logAuthFailure,
  sanitizeArgs,
  LOG_FILE,
};
