const request = require('supertest');
const app = require('../src/index');

describe('Authentication', () => {
  const initRpc = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'test-client', version: '1.0.0' },
      capabilities: {},
    },
  };

  function mcpPost() {
    return request(app)
      .post('/v1')
      .set('Accept', 'application/json, text/event-stream')
      .set('Content-Type', 'application/json');
  }

  it('rejects requests without Api-Key', async () => {
    const res = await mcpPost()
      .set('Api-Appid', 'test-app-id')
      .send(initRpc);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('rejects requests without Api-Appid', async () => {
    const res = await mcpPost()
      .set('Api-Key', 'test-api-key')
      .send(initRpc);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('rejects requests without any auth headers', async () => {
    const res = await mcpPost().send(initRpc);
    expect(res.status).toBe(401);
  });

  it('accepts initialize with valid auth headers', async () => {
    const res = await mcpPost()
      .set('Api-Key', 'test-key')
      .set('Api-Appid', 'test-app')
      .send(initRpc);
    expect(res.status).toBe(200);
    expect(res.body.result.serverInfo.name).toBe('ontraport-mcp-server');
    expect(res.body.result.capabilities.tools).toBeDefined();
  });
});
