const messages = require('../../src/tools/messages');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Message tools', () => {
  it('get_messages passes params', async () => {
    const client = mockClient();
    await messages.get_messages(client, { start: 0, range: 10, listFields: 'id,subject' });
    expect(client.get).toHaveBeenCalledWith('/Messages', { start: 0, range: 10, listFields: 'id,subject' });
  });

  it('get_message fetches by id', async () => {
    const client = mockClient();
    await messages.get_message(client, { id: 5 });
    expect(client.get).toHaveBeenCalledWith('/Message', { id: 5 });
  });

  it('send_message posts correct body', async () => {
    const client = mockClient();
    await messages.send_message(client, { contact_id: 27, message_id: 5 });
    expect(client.post).toHaveBeenCalledWith('/message', { contact_id: 27, message_id: 5 });
  });
});
