const { createMcpServer, SERVER_INFO } = require('../src/mcp/server');

describe('MCP Server Factory', () => {
  it('creates a server with correct info', () => {
    const server = createMcpServer('test-key', 'test-app');
    expect(server).toBeDefined();
    expect(SERVER_INFO.name).toBe('ontraport-mcp-server');
    expect(SERVER_INFO.version).toBe('1.0.0');
  });

  it('creates isolated servers for different credentials', () => {
    const server1 = createMcpServer('key1', 'app1');
    const server2 = createMcpServer('key2', 'app2');
    expect(server1).not.toBe(server2);
  });
});
