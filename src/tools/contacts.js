const { badRequest } = require('../errors');

async function get_contact(client, params) {
  if (params.email) {
    return client.get('/object/getByEmail', { objectID: 0, email: params.email });
  }
  if (params.id !== undefined) {
    return client.get('/Contact', { id: params.id });
  }
  throw badRequest('Either id or email is required for get_contact.');
}

async function search_contacts(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.search) query.search = params.search;
  if (params.listFields) query.listFields = params.listFields;
  if (params.sort) query.sort = params.sort;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.start !== undefined) query.start = params.start;
  query.range = params.range || 50;
  return client.get('/Contacts', query);
}

async function create_contact(client, params) {
  return client.post('/Contacts', params);
}

async function merge_or_create_contact(client, params) {
  if (!params.email) {
    throw badRequest('email is required for merge_or_create_contact.');
  }
  return client.post('/Contacts/saveorupdate', params);
}

async function update_contact(client, params) {
  if (params.id === undefined) {
    throw badRequest('id is required for update_contact.');
  }
  return client.put('/Contacts', params);
}

async function delete_contact(client, params) {
  if (params.id === undefined) {
    throw badRequest('id is required for delete_contact.');
  }
  return client.delete('/Contact', { params: { id: params.id } });
}

async function get_contact_count(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.search) query.search = params.search;
  return client.get('/Contacts/getInfo', query);
}

module.exports = {
  get_contact,
  search_contacts,
  create_contact,
  merge_or_create_contact,
  update_contact,
  delete_contact,
  get_contact_count,
};
