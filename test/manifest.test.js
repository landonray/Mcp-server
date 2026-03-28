const { buildManifest, BUILTIN_OBJECT_TYPE_IDS, MAX_MANIFEST_TOOLS } = require('../src/manifest/builder');
const { staticTools } = require('../src/manifest/static-tools');

// Mock Ontraport client
function mockClient(metaResponse) {
  return {
    get: jest.fn().mockResolvedValue(metaResponse),
  };
}

describe('Manifest Builder', () => {
  it('returns all static tools when no custom objects exist', async () => {
    const client = mockClient({ data: {} });
    const manifest = await buildManifest(client);
    expect(manifest.length).toBe(staticTools.length);
    expect(client.get).toHaveBeenCalledWith('/objects/meta');
  });

  it('includes custom object tools', async () => {
    const client = mockClient({
      data: {
        '0': { name: 'Contact' },   // built-in, should be skipped
        '10000': { name: 'Project', last_modified: '1000' },
      },
    });

    const manifest = await buildManifest(client);
    const customTools = manifest.filter(t => t.name.includes('Project'));
    expect(customTools).toHaveLength(4);
    expect(customTools.map(t => t.name).sort()).toEqual([
      'create_Project',
      'get_Project',
      'search_Project',
      'update_Project',
    ]);
  });

  it('skips built-in object type IDs', async () => {
    const metaData = {};
    for (const id of BUILTIN_OBJECT_TYPE_IDS) {
      metaData[String(id)] = { name: `BuiltIn_${id}` };
    }
    const client = mockClient({ data: metaData });
    const manifest = await buildManifest(client);
    expect(manifest.length).toBe(staticTools.length);
  });

  it('enforces 100-tool cap and adds truncation note', async () => {
    const metaData = {};
    // Generate enough custom objects to exceed the limit
    // Each custom object generates 4 tools
    for (let i = 0; i < 30; i++) {
      metaData[String(10000 + i)] = {
        name: `CustomObj${i}`,
        last_modified: String(1000 + i),
      };
    }
    const client = mockClient({ data: metaData });
    const manifest = await buildManifest(client);

    // Should not exceed MAX_MANIFEST_TOOLS + 1 (for the note)
    const regularTools = manifest.filter(t => t.name !== '_manifest_note');
    expect(regularTools.length).toBeLessThanOrEqual(MAX_MANIFEST_TOOLS);

    // Should have the truncation note
    const note = manifest.find(t => t.name === '_manifest_note');
    expect(note).toBeDefined();
    expect(note.description).toContain('additional custom objects');
  });

  it('truncates at whole-object boundaries (groups of 4)', async () => {
    const metaData = {};
    for (let i = 0; i < 30; i++) {
      metaData[String(10000 + i)] = {
        name: `Obj${i}`,
        last_modified: String(1000 + i),
      };
    }
    const client = mockClient({ data: metaData });
    const manifest = await buildManifest(client);

    // Each included custom object should have exactly 4 tools
    const customTools = manifest.filter(t =>
      t.name !== '_manifest_note' &&
      !staticTools.some(st => st.name === t.name)
    );
    expect(customTools.length % 4).toBe(0);
  });

  it('does not leak internal fields into manifest entries', async () => {
    const client = mockClient({
      data: {
        '10000': { name: 'Widget', last_modified: '1000' },
      },
    });
    const manifest = await buildManifest(client);
    for (const tool of manifest) {
      expect(tool._objectTypeId).toBeUndefined();
      expect(tool._objectName).toBeUndefined();
      expect(tool.module).toBeUndefined();
      expect(tool.objectTypeId).toBeUndefined();
      expect(tool.objectName).toBeUndefined();
    }
  });

  it('sorts custom objects by most recently modified', async () => {
    const client = mockClient({
      data: {
        '10001': { name: 'Older', last_modified: '100' },
        '10002': { name: 'Newer', last_modified: '200' },
      },
    });

    const manifest = await buildManifest(client);
    const customTools = manifest.filter(
      t => t.name.includes('Older') || t.name.includes('Newer')
    );

    // Newer tools should appear before Older tools
    const newerIdx = manifest.findIndex(t => t.name === 'get_Newer');
    const olderIdx = manifest.findIndex(t => t.name === 'get_Older');
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it('throws if /objects/meta call fails', async () => {
    const client = {
      get: jest.fn().mockRejectedValue(new Error('API failure')),
    };

    await expect(buildManifest(client)).rejects.toThrow('API failure');
  });

  it('each static tool has name, description, and inputSchema', () => {
    for (const tool of staticTools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
      expect(tool.inputSchema.type).toBe('object');
    }
  });
});
