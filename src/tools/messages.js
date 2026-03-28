async function get_messages(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.listFields) query.listFields = params.listFields;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Messages', query);
}

async function get_message(client, params) {
  return client.get('/Message', { id: params.id });
}

async function send_message(client, params) {
  return client.post('/message', {
    contact_id: params.contact_id,
    message_id: params.message_id,
  });
}

module.exports = { get_messages, get_message, send_message };
