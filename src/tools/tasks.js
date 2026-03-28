async function assign_task(client, params) {
  return client.post('/task/assign', {
    object_type_id: params.object_type_id,
    ids: params.ids,
    message: params.message,
  });
}

async function complete_task(client, params) {
  const body = {
    object_type_id: params.object_type_id,
    ids: params.ids,
  };
  if (params.data) {
    body.data = params.data;
  }
  return client.post('/task/complete', body);
}

async function cancel_task(client, params) {
  return client.post('/task/cancel', {
    objectID: params.objectID,
    ids: params.ids,
  });
}

async function update_task(client, params) {
  const body = { id: params.id };
  if (params.owner !== undefined) body.owner = params.owner;
  if (params.date_due !== undefined) body.date_due = params.date_due;
  if (params.status !== undefined) body.status = params.status;
  return client.put('/Tasks', body);
}

async function get_tasks(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.sort) query.sort = params.sort;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Tasks', query);
}

async function reschedule_task(client, params) {
  return client.post('/task/reschedule', {
    id: params.id,
    newtime: params.newtime,
  });
}

module.exports = {
  assign_task,
  complete_task,
  cancel_task,
  update_task,
  reschedule_task,
  get_tasks,
};
