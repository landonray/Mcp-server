const { badRequest } = require('../errors');

async function refund_transaction(client, params) {
  return client.put('/transaction/refund', { ids: params.ids });
}

async function void_transaction(client, params) {
  return client.put('/transaction/void', { ids: params.ids });
}

async function write_off_transaction(client, params) {
  return client.put('/transaction/writeOff', { ids: params.ids });
}

async function mark_transaction_paid(client, params) {
  const body = { id: params.id };
  if (params.type !== undefined) body.type = params.type;
  return client.put('/transaction/markPaid', body);
}

async function rerun_transaction(client, params) {
  return client.post('/transaction/rerun', { ids: params.ids });
}

async function resend_invoice(client, params) {
  return client.post('/transaction/resendInvoice', { ids: params.ids });
}

async function cancel_subscription(client, params) {
  if (!params.ids || !params.ids.length) {
    throw badRequest('ids (array of order IDs) is required for cancel_subscription.');
  }
  // Delete orders one at a time since DELETE /order takes a single id
  const results = [];
  for (const id of params.ids) {
    const result = await client.delete('/order', { params: { id } });
    results.push(result);
  }
  return results.length === 1 ? results[0] : { data: results };
}

async function delete_order(client, params) {
  if (params.id === undefined) {
    throw badRequest('id is required for delete_order.');
  }
  return client.delete('/order', { params: { id: params.id } });
}

async function convert_to_collections(client, params) {
  return client.put('/transaction/convertToCollections', { ids: params.ids });
}

async function process_transaction(client, params) {
  if (!params.contact_id) {
    throw badRequest('contact_id is required for process_transaction.');
  }
  if (!params.offer) {
    throw badRequest('offer is required for process_transaction.');
  }
  if (!params.gateway_id) {
    throw badRequest('gateway_id is required for process_transaction.');
  }

  const body = {
    contact_id: params.contact_id,
    chargeNow: 'chargeNow',
    offer: params.offer,
    gateway_id: params.gateway_id,
    invoice_template: params.invoice_template !== undefined ? params.invoice_template : 1,
  };

  // Card on file: cc_id or payer.id. If neither provided, charges default card.
  if (params.cc_id !== undefined) {
    body.cc_id = params.cc_id;
  } else if (params.payer_id !== undefined) {
    body.cc_id = params.payer_id;
  }

  if (params.billing_address) body.billing_address = params.billing_address;
  if (params.trans_date !== undefined) body.trans_date = params.trans_date;
  if (params.external_order_id) body.external_order_id = params.external_order_id;
  if (params.customer_note) body.customer_note = params.customer_note;
  if (params.internal_note) body.internal_note = params.internal_note;

  return client.post('/transaction/processManual', body);
}

async function log_transaction(client, params) {
  if (!params.contact_id) {
    throw badRequest('contact_id is required for log_transaction.');
  }
  if (!params.offer) {
    throw badRequest('offer is required for log_transaction.');
  }

  const body = {
    contact_id: params.contact_id,
    chargeNow: 'chargeLog',
    offer: params.offer,
  };
  if (params.invoice_template !== undefined) body.invoice_template = params.invoice_template;
  if (params.trans_date !== undefined) body.trans_date = params.trans_date;
  if (params.external_order_id) body.external_order_id = params.external_order_id;
  if (params.customer_note) body.customer_note = params.customer_note;
  if (params.internal_note) body.internal_note = params.internal_note;

  return client.post('/transaction/processManual', body);
}

async function get_order(client, params) {
  if (params.id === undefined) {
    throw badRequest('id is required for get_order.');
  }
  return client.get('/transaction/order', { id: params.id });
}

async function update_order(client, params) {
  if (!params.offer) {
    throw badRequest('offer is required for update_order. WARNING: omitting offer data deletes the order.');
  }
  if (!params.offer.order_id) {
    throw badRequest('offer.order_id is required for update_order.');
  }
  if (!params.offer.offer_id) {
    throw badRequest('offer.offer_id is required for update_order.');
  }
  return client.put('/transaction/order', { offer: params.offer });
}

module.exports = {
  refund_transaction,
  void_transaction,
  write_off_transaction,
  mark_transaction_paid,
  rerun_transaction,
  resend_invoice,
  cancel_subscription,
  delete_order,
  convert_to_collections,
  process_transaction,
  log_transaction,
  get_order,
  update_order,
};
