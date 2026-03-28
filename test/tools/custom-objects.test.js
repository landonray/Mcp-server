const customObjects = require('../../src/tools/custom-objects');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: { id: '1' } }),
    post: jest.fn().mockResolvedValue({ data: { id: '1' } }),
    put: jest.fn().mockResolvedValue({ data: { id: '1' } }),
  };
}

describe('Custom Object tools', () => {
  const objectTypeId = 10000;

  it('get_custom_object queries with objectID', async () => {
    const client = mockClient();
    await customObjects.get_custom_object(client, { id: 5 }, objectTypeId);
    expect(client.get).toHaveBeenCalledWith('/object', { objectID: 10000, id: 5 });
  });

  it('get_custom_object throws without id', async () => {
    const client = mockClient();
    await expect(customObjects.get_custom_object(client, {}, objectTypeId)).rejects.toThrow('id is required');
  });

  it('create_custom_object posts with objectID', async () => {
    const client = mockClient();
    await customObjects.create_custom_object(client, { owner: 1, name: 'Test' }, objectTypeId);
    expect(client.post).toHaveBeenCalledWith('/objects', { objectID: 10000, owner: 1, name: 'Test' });
  });

  it('update_custom_object puts with objectID', async () => {
    const client = mockClient();
    await customObjects.update_custom_object(client, { id: 5, name: 'Updated' }, objectTypeId);
    expect(client.put).toHaveBeenCalledWith('/objects', { objectID: 10000, id: 5, name: 'Updated' });
  });

  it('update_custom_object throws without id', async () => {
    const client = mockClient();
    await expect(customObjects.update_custom_object(client, {}, objectTypeId)).rejects.toThrow('id is required');
  });

  it('search_custom_object queries with objectID and params', async () => {
    const client = mockClient();
    await customObjects.search_custom_object(client, { search: 'test', start: 0, range: 10 }, objectTypeId);
    expect(client.get).toHaveBeenCalledWith('/objects', { objectID: 10000, search: 'test', start: 0, range: 10 });
  });
});
