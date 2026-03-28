const metadata = require('../../src/tools/metadata');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Metadata tools', () => {
  it('get_object_meta calls /objects/meta', async () => {
    const client = mockClient();
    await metadata.get_object_meta(client, {});
    expect(client.get).toHaveBeenCalledWith('/objects/meta', {});
  });

  it('get_object_meta passes objectID and format', async () => {
    const client = mockClient();
    await metadata.get_object_meta(client, { objectID: 0, format: 'byId' });
    expect(client.get).toHaveBeenCalledWith('/objects/meta', { objectID: 0, format: 'byId' });
  });

  it('get_collection_count calls /objects/getInfo', async () => {
    const client = mockClient();
    await metadata.get_collection_count(client, { objectID: 0 });
    expect(client.get).toHaveBeenCalledWith('/objects/getInfo', { objectID: 0 });
  });

  it('get_collection_count passes condition and search', async () => {
    const client = mockClient();
    await metadata.get_collection_count(client, { objectID: 0, condition: '[]', search: 'test' });
    expect(client.get).toHaveBeenCalledWith('/objects/getInfo', { objectID: 0, condition: '[]', search: 'test' });
  });
});
