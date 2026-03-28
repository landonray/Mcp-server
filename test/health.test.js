const request = require('supertest');
const app = require('../src/index');

describe('Health endpoint', () => {
  it('GET /v1/health returns 200 with status ok', async () => {
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(200);
  });
});
