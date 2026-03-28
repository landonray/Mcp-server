const contacts = require('../../src/tools/contacts');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: { id: '27', firstname: 'Mary' } }),
    post: jest.fn().mockResolvedValue({ data: { id: '42' } }),
    put: jest.fn().mockResolvedValue({ data: { id: '27' } }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Contact tools', () => {
  describe('get_contact', () => {
    it('fetches by ID', async () => {
      const client = mockClient();
      await contacts.get_contact(client, { id: 27 });
      expect(client.get).toHaveBeenCalledWith('/Contact', { id: 27 });
    });

    it('fetches by email', async () => {
      const client = mockClient();
      await contacts.get_contact(client, { email: 'test@test.com' });
      expect(client.get).toHaveBeenCalledWith('/object/getByEmail', { objectID: 0, email: 'test@test.com' });
    });

    it('throws if neither id nor email provided', async () => {
      const client = mockClient();
      await expect(contacts.get_contact(client, {})).rejects.toThrow('Either id or email');
    });
  });

  describe('search_contacts', () => {
    it('passes all parameters', async () => {
      const client = mockClient();
      await contacts.search_contacts(client, {
        condition: '[{"field":{"field":"lastname"},"op":"=","value":{"value":"Smith"}}]',
        listFields: 'id,firstname',
        sort: 'id',
        sortDir: 'asc',
        start: 0,
        range: 10,
      });
      expect(client.get).toHaveBeenCalledWith('/Contacts', {
        condition: '[{"field":{"field":"lastname"},"op":"=","value":{"value":"Smith"}}]',
        listFields: 'id,firstname',
        sort: 'id',
        sortDir: 'asc',
        start: 0,
        range: 10,
      });
    });

    it('defaults range to 50', async () => {
      const client = mockClient();
      await contacts.search_contacts(client, {});
      expect(client.get).toHaveBeenCalledWith('/Contacts', { range: 50 });
    });
  });

  describe('create_contact', () => {
    it('posts contact data', async () => {
      const client = mockClient();
      await contacts.create_contact(client, { email: 'a@b.com', firstname: 'A' });
      expect(client.post).toHaveBeenCalledWith('/Contacts', { email: 'a@b.com', firstname: 'A' });
    });
  });

  describe('merge_or_create_contact', () => {
    it('posts to saveorupdate', async () => {
      const client = mockClient();
      await contacts.merge_or_create_contact(client, { email: 'a@b.com', firstname: 'A' });
      expect(client.post).toHaveBeenCalledWith('/Contacts/saveorupdate', { email: 'a@b.com', firstname: 'A' });
    });

    it('throws if email is missing', async () => {
      const client = mockClient();
      await expect(contacts.merge_or_create_contact(client, {})).rejects.toThrow('email is required');
    });
  });

  describe('update_contact', () => {
    it('puts with id and fields', async () => {
      const client = mockClient();
      await contacts.update_contact(client, { id: 27, firstname: 'Updated' });
      expect(client.put).toHaveBeenCalledWith('/Contacts', { id: 27, firstname: 'Updated' });
    });

    it('throws if id is missing', async () => {
      const client = mockClient();
      await expect(contacts.update_contact(client, {})).rejects.toThrow('id is required');
    });
  });

  describe('delete_contact', () => {
    it('deletes by id', async () => {
      const client = mockClient();
      await contacts.delete_contact(client, { id: 27 });
      expect(client.delete).toHaveBeenCalledWith('/Contact', { params: { id: 27 } });
    });

    it('throws if id is missing', async () => {
      const client = mockClient();
      await expect(contacts.delete_contact(client, {})).rejects.toThrow('id is required');
    });
  });

  describe('get_contact_count', () => {
    it('calls getInfo endpoint', async () => {
      const client = mockClient();
      await contacts.get_contact_count(client, { condition: '[]' });
      expect(client.get).toHaveBeenCalledWith('/Contacts/getInfo', { condition: '[]' });
    });
  });
});
