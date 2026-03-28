const sequences = require('../../src/tools/sequences');

function mockClient() {
  return {
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Sequence tools', () => {
  it('subscribe_to_sequence defaults sub_type to Campaign', async () => {
    const client = mockClient();
    await sequences.subscribe_to_sequence(client, { ids: '1,2', add_list: '5' });
    expect(client.put).toHaveBeenCalledWith('/objects/subscribe', {
      objectID: 0, ids: '1,2', add_list: '5', sub_type: 'Campaign',
    });
  });

  it('subscribe_to_sequence uses provided sub_type', async () => {
    const client = mockClient();
    await sequences.subscribe_to_sequence(client, { ids: '1', add_list: '5', sub_type: 'Sequence' });
    expect(client.put).toHaveBeenCalledWith('/objects/subscribe', {
      objectID: 0, ids: '1', add_list: '5', sub_type: 'Sequence',
    });
  });

  it('unsubscribe_from_sequence sends delete', async () => {
    const client = mockClient();
    await sequences.unsubscribe_from_sequence(client, { ids: '1', remove_list: '5' });
    expect(client.delete).toHaveBeenCalledWith('/objects/subscribe', {
      body: { objectID: 0, ids: '1', remove_list: '5', sub_type: 'Campaign' },
    });
  });

  it('pause_rules_and_sequences posts correct body', async () => {
    const client = mockClient();
    await sequences.pause_rules_and_sequences(client, { ids: '1', objectID: 0 });
    expect(client.post).toHaveBeenCalledWith('/objects/pause', { objectID: 0, ids: '1' });
  });

  it('unpause_rules_and_sequences posts correct body', async () => {
    const client = mockClient();
    await sequences.unpause_rules_and_sequences(client, { ids: '1', objectID: 0 });
    expect(client.post).toHaveBeenCalledWith('/objects/unpause', { objectID: 0, ids: '1' });
  });
});
