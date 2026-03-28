async function list_products(client, params) {
  const query = {};
  if (params.listFields) query.listFields = params.listFields;
  if (params.start !== undefined) query.start = params.start;
  if (params.range !== undefined) query.range = params.range;
  return client.get('/Products', query);
}

async function get_product(client, params) {
  return client.get('/Product', { id: params.id });
}

module.exports = { list_products, get_product };
