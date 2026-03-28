const { badRequest } = require('../errors');

async function get_custom_object(client, params, objectTypeId) {
  if (params.id === undefined) {
    throw badRequest('id is required.');
  }
  return client.get('/object', { objectID: objectTypeId, id: params.id });
}

async function create_custom_object(client, params, objectTypeId) {
  return client.post('/objects', {
    objectID: objectTypeId,
    ...params,
  });
}

async function update_custom_object(client, params, objectTypeId) {
  if (params.id === undefined) {
    throw badRequest('id is required.');
  }
  return client.put('/objects', {
    objectID: objectTypeId,
    ...params,
  });
}

async function search_custom_object(client, params, objectTypeId) {
  const query = { objectID: objectTypeId };
  if (params.condition) query.condition = params.condition;
  if (params.search) query.search = params.search;
  if (params.listFields) query.listFields = params.listFields;
  if (params.sort) query.sort = params.sort;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/objects', query);
}

module.exports = {
  get_custom_object,
  create_custom_object,
  update_custom_object,
  search_custom_object,
};
