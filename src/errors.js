class McpError extends Error {
  constructor(code, errorType, message) {
    super(message);
    this.code = code;
    this.errorType = errorType;
  }

  toJSON() {
    return {
      code: this.code,
      error: this.errorType,
      message: this.message,
    };
  }
}

function badRequest(message) {
  return new McpError(400, 'bad_request', message || 'Do not retry. Fix malformed input parameters and try again.');
}

function unauthorized(message) {
  return new McpError(401, 'unauthorized', message || 'Invalid or missing Api-Key / Api-Appid. Do not retry without new credentials.');
}

function forbidden(message) {
  return new McpError(403, 'forbidden', message || 'The API key does not have the required scope for this operation. Report the missing scope to the user.');
}

function notFound(message) {
  return new McpError(404, 'not_found', message || 'The requested object ID does not exist, or the endpoint URL is incorrect. Verify object IDs before retrying.');
}

function unprocessable(message) {
  return new McpError(422, 'unprocessable_entity', message || 'Field validation failed. Fix the invalid field values and retry.');
}

function rateLimited(retryAfter) {
  const err = new McpError(429, 'rate_limited', 'Retry after a backoff. Ontraport allows 180 requests/minute/account.');
  err.retryAfter = retryAfter;
  return err;
}

function serverError(message) {
  return new McpError(500, 'server_error', message || 'Retry with exponential backoff (max 3 attempts). If persistent, report to the user.');
}

function fromHttpStatus(status, message) {
  switch (status) {
    case 400: return badRequest(message);
    case 401: return unauthorized(message);
    case 403: return forbidden(message);
    case 404: return notFound(message);
    case 422: return unprocessable(message);
    case 429: return rateLimited();
    case 500: return serverError(message);
    default: return new McpError(status, 'unknown_error', message || `Unexpected error (HTTP ${status}).`);
  }
}

module.exports = {
  McpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  unprocessable,
  rateLimited,
  serverError,
  fromHttpStatus,
};
