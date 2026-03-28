async function subscribe_to_sequence(client, params) {
  return client.put('/objects/subscribe', {
    objectID: 0,
    ids: params.ids,
    add_list: params.add_list,
    sub_type: params.sub_type || 'Campaign',
  });
}

async function unsubscribe_from_sequence(client, params) {
  return client.delete('/objects/subscribe', {
    body: {
      objectID: 0,
      ids: params.ids,
      remove_list: params.remove_list,
      sub_type: params.sub_type || 'Campaign',
    },
  });
}

async function pause_rules_and_sequences(client, params) {
  return client.post('/objects/pause', {
    objectID: params.objectID,
    ids: params.ids,
  });
}

async function unpause_rules_and_sequences(client, params) {
  return client.post('/objects/unpause', {
    objectID: params.objectID,
    ids: params.ids,
  });
}

module.exports = {
  subscribe_to_sequence,
  unsubscribe_from_sequence,
  pause_rules_and_sequences,
  unpause_rules_and_sequences,
};
