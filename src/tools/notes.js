async function create_note(client, params) {
  return client.post('/objects', {
    objectID: 12,
    contact_id: params.contact_id,
    data: params.data,
    ...(params.owner !== undefined && { owner: params.owner }),
  });
}

async function get_notes(client, params) {
  const query = { objectID: 12 };
  if (params.condition) query.condition = params.condition;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/objects', query);
}

module.exports = { create_note, get_notes };
