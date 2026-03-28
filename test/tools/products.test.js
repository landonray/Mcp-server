const products = require('../../src/tools/products');

function mockClient() {
  return {
    get: jest.fn().mockResolvedValue({ data: [] }),
  };
}

describe('Product tools', () => {
  it('list_products queries /Products', async () => {
    const client = mockClient();
    await products.list_products(client, { start: 0, range: 10 });
    expect(client.get).toHaveBeenCalledWith('/Products', { start: 0, range: 10 });
  });

  it('get_product queries /Product by id', async () => {
    const client = mockClient();
    await products.get_product(client, { id: 5 });
    expect(client.get).toHaveBeenCalledWith('/Product', { id: 5 });
  });
});
