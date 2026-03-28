const request = require('supertest');
const app = require('../src/index');

describe('Authentication', () => {
  const validRpc = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
  };

  it('rejects requests without Api-Key', async () => {
    const res = await request(app)
      .post('/v1')
      .set('Api-Appid', 'test-app-id')
      .send(validRpc);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('rejects requests without Api-Appid', async () => {
    const res = await request(app)
      .post('/v1')
      .set('Api-Key', 'test-api-key')
      .send(validRpc);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });

  it('rejects requests without any auth headers', async () => {
    const res = await request(app)
      .post('/v1')
      .send(validRpc);
    expect(res.status).toBe(401);
  });

  it('rejects invalid JSON-RPC requests', async () => {
    const res = await request(app)
      .post('/v1')
      .set('Api-Key', 'test-key')
      .set('Api-Appid', 'test-app')
      .send({ bad: 'request' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(-32600);
  });

  it('accepts initialize with valid auth headers', async () => {
    const res = await request(app)
      .post('/v1')
      .set('Api-Key', 'test-key')
      .set('Api-Appid', 'test-app')
      .send(validRpc);
    expect(res.status).toBe(200);
    expect(res.body.result.serverInfo.name).toBe('ontraport-mcp-server');
  });
});
