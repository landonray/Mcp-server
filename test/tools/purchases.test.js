const purchases = require('../../src/tools/purchases');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
  };
}

describe('Purchase tools', () => {
  it('get_purchases queries /Purchases', async () => {
    const client = mockClient();
    await purchases.get_purchases(client, { start: 0, range: 10 });
    expect(client.get).toHaveBeenCalledWith('/Purchases', { start: 0, range: 10 });
  });

  it('get_purchase_logs queries /PurchaseHistoryLogs', async () => {
    const client = mockClient();
    await purchases.get_purchase_logs(client, {});
    expect(client.get).toHaveBeenCalledWith('/PurchaseHistoryLogs', {});
  });

  it('get_transactions queries /Transactions with all params', async () => {
    const client = mockClient();
    await purchases.get_transactions(client, { sort: 'id', sortDir: 'desc', start: 0, range: 50 });
    expect(client.get).toHaveBeenCalledWith('/Transactions', { sort: 'id', sortDir: 'desc', start: 0, range: 50 });
  });

  it('get_orders queries /Orders', async () => {
    const client = mockClient();
    await purchases.get_orders(client, {});
    expect(client.get).toHaveBeenCalledWith('/Orders', {});
  });

  it('get_open_orders queries /OpenOrders', async () => {
    const client = mockClient();
    await purchases.get_open_orders(client, { condition: '[]' });
    expect(client.get).toHaveBeenCalledWith('/OpenOrders', { condition: '[]' });
  });
});
