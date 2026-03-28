const transactions = require('../../src/tools/transactions');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: {} }),
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

  describe('process_transaction', () => {
    it('posts to processManual with chargeNow=1 and payer as card ID', async () => {
      const client = mockClient();
      const offer = { products: [{ id: 1, quantity: 1 }] };
      await transactions.process_transaction(client, {
        contact_id: 27,
        payer_id: 5,
        offer,
        gateway_id: 1,
      });
      expect(client.post).toHaveBeenCalledWith('/transaction/processManual', {
        contact_id: 27,
        chargeNow: 1,
        offer,
        payer: { id: 5 },
        gateway_id: 1,
      });
    });

    it('includes optional billing_address and invoice_template', async () => {
      const client = mockClient();
      const offer = { products: [{ id: 1, quantity: 1 }] };
      const billing = { address: '123 Main', city: 'Austin', state: 'TX', zip: '78701', country: 'US' };
      await transactions.process_transaction(client, {
        contact_id: 27,
        payer_id: 5,
        offer,
        billing_address: billing,
        invoice_template: 0,
      });
      expect(client.post).toHaveBeenCalledWith('/transaction/processManual', {
        contact_id: 27,
        chargeNow: 1,
        offer,
        payer: { id: 5 },
        billing_address: billing,
        invoice_template: 0,
      });
    });

    it('throws if contact_id is missing', async () => {
      const client = mockClient();
      await expect(transactions.process_transaction(client, { payer_id: 5, offer: {} }))
        .rejects.toThrow('contact_id is required');
    });

    it('throws if payer_id is missing', async () => {
      const client = mockClient();
      await expect(transactions.process_transaction(client, { contact_id: 27, offer: {} }))
        .rejects.toThrow('payer_id');
    });

    it('throws if offer is missing', async () => {
      const client = mockClient();
      await expect(transactions.process_transaction(client, { contact_id: 27, payer_id: 5 }))
        .rejects.toThrow('offer is required');
    });
  });

  describe('log_transaction', () => {
    it('posts to processManual with chargeNow=0', async () => {
      const client = mockClient();
      const offer = { products: [{ id: 2, quantity: 3 }] };
      await transactions.log_transaction(client, { contact_id: 27, offer });
      expect(client.post).toHaveBeenCalledWith('/transaction/processManual', {
        contact_id: 27,
        chargeNow: 0,
        offer,
      });
    });

    it('includes optional invoice_template', async () => {
      const client = mockClient();
      await transactions.log_transaction(client, { contact_id: 27, offer: {}, invoice_template: 1 });
      expect(client.post).toHaveBeenCalledWith('/transaction/processManual', {
        contact_id: 27,
        chargeNow: 0,
        offer: {},
        invoice_template: 1,
      });
    });

    it('throws if contact_id is missing', async () => {
      const client = mockClient();
      await expect(transactions.log_transaction(client, { offer: {} }))
        .rejects.toThrow('contact_id is required');
    });

    it('throws if offer is missing', async () => {
      const client = mockClient();
      await expect(transactions.log_transaction(client, { contact_id: 27 }))
        .rejects.toThrow('offer is required');
    });
  });

  describe('get_order', () => {
    it('gets order by transaction id', async () => {
      const client = mockClient();
      await transactions.get_order(client, { id: 10 });
      expect(client.get).toHaveBeenCalledWith('/transaction/order', { id: 10 });
    });

    it('throws if id is missing', async () => {
      const client = mockClient();
      await expect(transactions.get_order(client, {})).rejects.toThrow('id is required');
    });
  });

  describe('update_order', () => {
    it('puts order update with id and fields', async () => {
      const client = mockClient();
      await transactions.update_order(client, { id: 10, next_charge_date: 1700000000 });
      expect(client.put).toHaveBeenCalledWith('/transaction/order', { id: 10, next_charge_date: 1700000000 });
    });

    it('throws if id is missing', async () => {
      const client = mockClient();
      await expect(transactions.update_order(client, {})).rejects.toThrow('id is required');
    });
  });
});
