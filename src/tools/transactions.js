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

async function process_transaction(client, params) {
  if (!params.contact_id) {
    throw badRequest('contact_id is required for process_transaction.');
  }
  if (!params.offer) {
    throw badRequest('offer is required for process_transaction.');
  }
  if (!params.payer_id && params.payer_id !== 0) {
    throw badRequest('payer_id (credit card on file ID) is required. New card details are not accepted — use a card already on file.');
  }

  const body = {
    contact_id: params.contact_id,
    chargeNow: 1,
    offer: params.offer,
    payer: { id: params.payer_id },
  };
  if (params.gateway_id !== undefined) body.gateway_id = params.gateway_id;
  if (params.invoice_template !== undefined) body.invoice_template = params.invoice_template;
  if (params.billing_address) body.billing_address = params.billing_address;

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
    chargeNow: 0,
    offer: params.offer,
  };
  if (params.invoice_template !== undefined) body.invoice_template = params.invoice_template;

  return client.post('/transaction/processManual', body);
}

async function get_order(client, params) {
  if (params.id === undefined) {
    throw badRequest('id is required for get_order.');
  }
  return client.get('/transaction/order', { id: params.id });
}

async function update_order(client, params) {
  if (params.id === undefined) {
    throw badRequest('id is required for update_order.');
  }
  return client.put('/transaction/order', params);
}

module.exports = {
  refund_transaction,
  void_transaction,
  write_off_transaction,
  mark_transaction_paid,
  rerun_transaction,
  resend_invoice,
  process_transaction,
  log_transaction,
  get_order,
  update_order,
};
