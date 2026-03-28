async function get_purchases(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.listFields) query.listFields = params.listFields;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Purchases', query);
}

async function get_purchase_logs(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/PurchaseHistoryLogs', query);
}

async function get_transactions(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.listFields) query.listFields = params.listFields;
  if (params.sort) query.sort = params.sort;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Transactions', query);
}

async function get_orders(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Orders', query);
}

async function get_open_orders(client, params) {
  const query = {};
  if (params.condition) query.condition = params.condition;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/OpenOrders', query);
}

module.exports = {
  get_purchases,
  get_purchase_logs,
  get_transactions,
  get_orders,
  get_open_orders,
};
