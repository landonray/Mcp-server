const { cleanResponse, STRIPPED_FIELDS } = require('../src/ontraport/response-cleaner');

describe('Response Cleaner', () => {
  it('strips all noise fields from a flat object', () => {
    const input = {
      id: '27',
      firstname: 'Mary',
      system_source: 'api',
      source_location: 'import',
      import_id: '123',
      bindex: '5',
      ip_addy: '1.2.3.4',
      ip_addy_display: '1.2.3.4',
      contact_cat: 'old',
      updateSequence: '1',
      updateCampaign: '1',
      account_id: '12345',
    };

    const result = cleanResponse(input);
    expect(result.id).toBe('27');
    expect(result.firstname).toBe('Mary');

    for (const field of STRIPPED_FIELDS) {
      expect(result[field]).toBeUndefined();
    }
  });

  it('recursively cleans nested objects', () => {
    const input = {
      data: {
        id: '1',
        system_source: 'api',
        nested: {
          import_id: '5',
          name: 'test',
        },
      },
    };

    const result = cleanResponse(input);
    expect(result.data.id).toBe('1');
    expect(result.data.system_source).toBeUndefined();
    expect(result.data.nested.import_id).toBeUndefined();
    expect(result.data.nested.name).toBe('test');
  });

  it('recursively cleans arrays', () => {
    const input = {
      data: [
        { id: '1', bindex: '0', firstname: 'A' },
        { id: '2', bindex: '1', firstname: 'B' },
      ],
    };

    const result = cleanResponse(input);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].bindex).toBeUndefined();
    expect(result.data[0].firstname).toBe('A');
    expect(result.data[1].bindex).toBeUndefined();
  });

  it('handles null and undefined', () => {
    expect(cleanResponse(null)).toBeNull();
    expect(cleanResponse(undefined)).toBeUndefined();
  });

  it('preserves non-stripped fields', () => {
    const input = { id: '1', email: 'test@test.com', lastname: 'Smith' };
    const result = cleanResponse(input);
    expect(result).toEqual(input);
  });
});
