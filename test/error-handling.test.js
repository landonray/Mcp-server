const { badRequest, unauthorized, forbidden, notFound, unprocessable, rateLimited, serverError, fromHttpStatus, McpError } = require('../src/errors');

describe('Error Handling', () => {
  it('creates structured error objects', () => {
    const err = badRequest('Missing field');
    expect(err).toBeInstanceOf(McpError);
    expect(err.code).toBe(400);
    expect(err.errorType).toBe('bad_request');
    expect(err.message).toBe('Missing field');
  });

  it('toJSON returns correct structure', () => {
    const err = unauthorized();
    const json = err.toJSON();
    expect(json).toEqual({
      code: 401,
      error: 'unauthorized',
      message: expect.any(String),
    });
  });

  it('covers all error types', () => {
    expect(badRequest().code).toBe(400);
    expect(unauthorized().code).toBe(401);
    expect(forbidden().code).toBe(403);
    expect(notFound().code).toBe(404);
    expect(unprocessable().code).toBe(422);
    expect(rateLimited().code).toBe(429);
    expect(serverError().code).toBe(500);
  });

  it('rateLimited includes retryAfter', () => {
    const err = rateLimited('30');
    expect(err.retryAfter).toBe('30');
  });

  it('fromHttpStatus maps codes correctly', () => {
    expect(fromHttpStatus(400).code).toBe(400);
    expect(fromHttpStatus(401).code).toBe(401);
    expect(fromHttpStatus(403).code).toBe(403);
    expect(fromHttpStatus(404).code).toBe(404);
    expect(fromHttpStatus(422).code).toBe(422);
    expect(fromHttpStatus(429).code).toBe(429);
    expect(fromHttpStatus(500).code).toBe(500);
    expect(fromHttpStatus(503).code).toBe(503);
  });
});
