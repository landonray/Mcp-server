const tags = require('../../src/tools/tags');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Tag tools', () => {
  it('add_tag_by_name sends correct payload', async () => {
    const client = mockClient();
    await tags.add_tag_by_name(client, { ids: [27, 28], add_names: ['VIP', 'Newsletter'] });
    expect(client.put).toHaveBeenCalledWith('/objects/tagByName', {
      objectID: 0,
      ids: [27, 28],
      add_names: ['VIP', 'Newsletter'],
    });
  });

  it('remove_tag_by_name sends correct payload', async () => {
    const client = mockClient();
    await tags.remove_tag_by_name(client, { ids: [27], remove_names: ['VIP'] });
    expect(client.delete).toHaveBeenCalledWith('/objects/tagByName', {
      body: { objectID: 0, ids: [27], remove_names: ['VIP'] },
    });
  });

  it('add_tag_by_id sends correct payload', async () => {
    const client = mockClient();
    await tags.add_tag_by_id(client, { ids: '27,28', add_list: '1,2' });
    expect(client.put).toHaveBeenCalledWith('/objects/tag', {
      objectID: 0,
      ids: '27,28',
      add_list: '1,2',
    });
  });

  it('remove_tag_by_id sends correct payload', async () => {
    const client = mockClient();
    await tags.remove_tag_by_id(client, { ids: '27', remove_list: '1' });
    expect(client.delete).toHaveBeenCalledWith('/objects/tag', {
      body: { objectID: 0, ids: '27', remove_list: '1' },
    });
  });

  it('get_contacts_by_tag passes query params', async () => {
    const client = mockClient();
    await tags.get_contacts_by_tag(client, { tag_name: 'VIP', start: 0, range: 10 });
    expect(client.get).toHaveBeenCalledWith('/objects/tag', {
      objectID: 0,
      tag_name: 'VIP',
      start: 0,
      range: 10,
    });
  });

  it('list_tags passes pagination', async () => {
    const client = mockClient();
    await tags.list_tags(client, { start: 0, range: 50, sort: 'tag_name', sortDir: 'asc' });
    expect(client.get).toHaveBeenCalledWith('/Tags', {
      start: 0,
      range: 50,
      sort: 'tag_name',
      sortDir: 'asc',
    });
  });
});
