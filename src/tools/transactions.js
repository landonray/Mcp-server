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

module.exports = {
  refund_transaction,
  void_transaction,
  write_off_transaction,
  mark_transaction_paid,
  rerun_transaction,
  resend_invoice,
};
