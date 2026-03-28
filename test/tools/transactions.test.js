const transactions = require('../../src/tools/transactions');

function mockClient() {
  return {
    put: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  };
}

describe('Transaction tools', () => {
  it('refund_transaction', async () => {
    const client = mockClient();
    await transactions.refund_transaction(client, { ids: [1, 2] });
    expect(client.put).toHaveBeenCalledWith('/transaction/refund', { ids: [1, 2] });
  });

  it('void_transaction', async () => {
    const client = mockClient();
    await transactions.void_transaction(client, { ids: [1] });
    expect(client.put).toHaveBeenCalledWith('/transaction/void', { ids: [1] });
  });

  it('write_off_transaction', async () => {
    const client = mockClient();
    await transactions.write_off_transaction(client, { ids: [1] });
    expect(client.put).toHaveBeenCalledWith('/transaction/writeOff', { ids: [1] });
  });

  it('mark_transaction_paid with type', async () => {
    const client = mockClient();
    await transactions.mark_transaction_paid(client, { id: 1, type: 3 });
    expect(client.put).toHaveBeenCalledWith('/transaction/markPaid', { id: 1, type: 3 });
  });

  it('mark_transaction_paid without type', async () => {
    const client = mockClient();
    await transactions.mark_transaction_paid(client, { id: 1 });
    expect(client.put).toHaveBeenCalledWith('/transaction/markPaid', { id: 1 });
  });

  it('rerun_transaction', async () => {
    const client = mockClient();
    await transactions.rerun_transaction(client, { ids: [1] });
    expect(client.post).toHaveBeenCalledWith('/transaction/rerun', { ids: [1] });
  });

  it('resend_invoice', async () => {
    const client = mockClient();
    await transactions.resend_invoice(client, { ids: [1, 2] });
    expect(client.post).toHaveBeenCalledWith('/transaction/resendInvoice', { ids: [1, 2] });
  });
});
