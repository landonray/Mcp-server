const transactions = require('../../src/tools/transactions');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
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

  it('cancel_subscription deletes orders', async () => {
    const client = mockClient();
    await transactions.cancel_subscription(client, { ids: [10, 11] });
    expect(client.delete).toHaveBeenCalledTimes(2);
    expect(client.delete).toHaveBeenCalledWith('/order', { params: { id: 10 } });
    expect(client.delete).toHaveBeenCalledWith('/order', { params: { id: 11 } });
  });

  it('cancel_subscription single order returns unwrapped result', async () => {
    const client = mockClient();
    client.delete.mockResolvedValue({ data: { id: '10' } });
    const result = await transactions.cancel_subscription(client, { ids: [10] });
    expect(result).toEqual({ data: { id: '10' } });
  });

  it('cancel_subscription throws if ids empty', async () => {
    const client = mockClient();
    await expect(transactions.cancel_subscription(client, { ids: [] })).rejects.toThrow('ids');
  });

  it('delete_order deletes single order', async () => {
    const client = mockClient();
    await transactions.delete_order(client, { id: 10 });
    expect(client.delete).toHaveBeenCalledWith('/order', { params: { id: 10 } });
  });

  it('delete_order throws if id missing', async () => {
    const client = mockClient();
    await expect(transactions.delete_order(client, {})).rejects.toThrow('id is required');
  });

  it('convert_to_collections', async () => {
    const client = mockClient();
    await transactions.convert_to_collections(client, { ids: [10] });
    expect(client.put).toHaveBeenCalledWith('/transaction/convertToCollections', { ids: [10] });
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
    it('puts order update with full offer data', async () => {
      const client = mockClient();
      const offer = { offer_id: 8, order_id: 1, products: [{ id: 1, price: [{ price: 10, id: 1 }] }] };
      await transactions.update_order(client, { offer });
      expect(client.put).toHaveBeenCalledWith('/transaction/order', { offer });
    });

    it('throws if offer is missing', async () => {
      const client = mockClient();
      await expect(transactions.update_order(client, {})).rejects.toThrow('offer is required');
    });

    it('throws if offer.order_id is missing', async () => {
      const client = mockClient();
      await expect(transactions.update_order(client, { offer: { offer_id: 1 } })).rejects.toThrow('order_id');
    });

    it('throws if offer.offer_id is missing', async () => {
      const client = mockClient();
      await expect(transactions.update_order(client, { offer: { order_id: 1 } })).rejects.toThrow('offer_id');
    });
  });
});
