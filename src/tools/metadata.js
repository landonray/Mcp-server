async function get_object_meta(client, params) {
  const query = {};
  if (params.objectID !== undefined) query.objectID = params.objectID;
  if (params.format) query.format = params.format;
  return client.get('/objects/meta', query);
}

async function get_collection_count(client, params) {
  const query = { objectID: params.objectID };
  if (params.condition) query.condition = params.condition;
  if (params.search) query.search = params.search;
  return client.get('/objects/getInfo', query);
}

module.exports = { get_object_meta, get_collection_count };
