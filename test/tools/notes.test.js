const notes = require('../../src/tools/notes');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: { id: '1' } }),
  };
}

describe('Note tools', () => {
  it('create_note posts with objectID 12', async () => {
    const client = mockClient();
    await notes.create_note(client, { contact_id: 27, data: 'Test note' });
    expect(client.post).toHaveBeenCalledWith('/objects', {
      objectID: 12,
      contact_id: 27,
      data: 'Test note',
    });
  });

  it('create_note includes owner when provided', async () => {
    const client = mockClient();
    await notes.create_note(client, { contact_id: 27, data: 'Note', owner: 1 });
    expect(client.post).toHaveBeenCalledWith('/objects', {
      objectID: 12,
      contact_id: 27,
      data: 'Note',
      owner: 1,
    });
  });

  it('get_notes queries with objectID 12', async () => {
    const client = mockClient();
    await notes.get_notes(client, { start: 0, range: 10 });
    expect(client.get).toHaveBeenCalledWith('/objects', { objectID: 12, start: 0, range: 10 });
  });
});
