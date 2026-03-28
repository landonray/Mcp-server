const tasks = require('../../src/tools/tasks');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Task tools', () => {
  it('assign_task posts correct body', async () => {
    const client = mockClient();
    await tasks.assign_task(client, {
      object_type_id: 0,
      ids: [27],
      message: { id: 5, due_date: 1700000000 },
    });
    expect(client.post).toHaveBeenCalledWith('/task/assign', {
      object_type_id: 0,
      ids: [27],
      message: { id: 5, due_date: 1700000000 },
    });
  });

  it('complete_task posts with optional data', async () => {
    const client = mockClient();
    await tasks.complete_task(client, {
      object_type_id: 0,
      ids: [1],
      data: { outcome: ':=Done' },
    });
    expect(client.post).toHaveBeenCalledWith('/task/complete', {
      object_type_id: 0,
      ids: [1],
      data: { outcome: ':=Done' },
    });
  });

  it('cancel_task posts correct body', async () => {
    const client = mockClient();
    await tasks.cancel_task(client, { objectID: 0, ids: [1, 2] });
    expect(client.post).toHaveBeenCalledWith('/task/cancel', { objectID: 0, ids: [1, 2] });
  });

  it('update_task puts with partial fields', async () => {
    const client = mockClient();
    await tasks.update_task(client, { id: 1, status: 1 });
    expect(client.put).toHaveBeenCalledWith('/Tasks', { id: 1, status: 1 });
  });

  it('get_tasks passes query params', async () => {
    const client = mockClient();
    await tasks.get_tasks(client, { sort: 'date_due', sortDir: 'asc', start: 0, range: 10 });
    expect(client.get).toHaveBeenCalledWith('/Tasks', {
      sort: 'date_due', sortDir: 'asc', start: 0, range: 10,
    });
  });
});
