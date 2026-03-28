async function add_tag_by_name(client, params) {
  return client.put('/objects/tagByName', {
    objectID: 0,
    ids: params.ids,
    add_names: params.add_names,
  });
}

async function remove_tag_by_name(client, params) {
  return client.delete('/objects/tagByName', {
    body: {
      objectID: 0,
      ids: params.ids,
      remove_names: params.remove_names,
    },
  });
}

async function add_tag_by_id(client, params) {
  return client.put('/objects/tag', {
    objectID: 0,
    ids: params.ids,
    add_list: params.add_list,
  });
}

async function remove_tag_by_id(client, params) {
  return client.delete('/objects/tag', {
    body: {
      objectID: 0,
      ids: params.ids,
      remove_list: params.remove_list,
    },
  });
}

async function get_contacts_by_tag(client, params) {
  const query = { objectID: 0 };
  if (params.tag_name) query.tag_name = params.tag_name;
  if (params.tag_id !== undefined) query.tag_id = params.tag_id;
  if (params.listFields) query.listFields = params.listFields;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/objects/tag', query);
}

async function list_tags(client, params) {
  const query = {};
  if (params.sort) query.sort = params.sort;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Tags', query);
}

module.exports = {
  add_tag_by_name,
  remove_tag_by_name,
  add_tag_by_id,
  remove_tag_by_id,
  get_contacts_by_tag,
  list_tags,
};
