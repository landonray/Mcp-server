// Generates 4 tool definitions for a custom object discovered via /objects/meta.

function sanitizeName(name) {
  // Convert to a safe tool-name-friendly format
  return name
    .replace(/[^a-zA-Z0-9_ ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function generateCustomObjectTools(objectMeta) {
  const { name, objectTypeId } = objectMeta;
  const safeName = sanitizeName(name);

  const paginationProperties = {
    start: { type: 'integer', description: 'Zero-based offset. Default 0.' },
    range: { type: 'integer', description: 'Number of records to return. Max 50.', maximum: 50 },
    sort: { type: 'string', description: 'Field name to sort by.' },
    sortDir: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction.' },
  };

  return [
    {
      name: `get_${safeName}`,
      description: `Retrieve a single ${name} record by its ID. Returns all fields defined on the object.`,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: `The ${name} record ID.` },
        },
        required: ['id'],
      },
      module: 'custom-objects',
      objectTypeId,
      objectName: name,
    },
    {
      name: `create_${safeName}`,
      description: `Create a new ${name} record. The owner field is required for custom objects to save properly.`,
      inputSchema: {
        type: 'object',
        properties: {
          owner: { type: 'integer', description: 'Owner user ID (required for custom objects).' },
        },
        required: ['owner'],
        additionalProperties: true,
      },
      module: 'custom-objects',
      objectTypeId,
      objectName: name,
    },
    {
      name: `update_${safeName}`,
      description: `Update fields on an existing ${name} record. Only the fields you include will be changed.`,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: `The ${name} record ID to update.` },
        },
        required: ['id'],
        additionalProperties: true,
      },
      module: 'custom-objects',
      objectTypeId,
      objectName: name,
    },
    {
      name: `search_${safeName}`,
      description: `Search records in ${name} by field conditions, free-text search, or tag. Results are paginated with a maximum of 50 per request.`,
      inputSchema: {
        type: 'object',
        properties: {
          condition: {
            type: 'string',
            description: 'JSON-encoded filter criteria array.',
          },
          search: { type: 'string', description: 'Free-text search.' },
          listFields: { type: 'string', description: 'Comma-separated field names.' },
          ...paginationProperties,
        },
      },
      module: 'custom-objects',
      objectTypeId,
      objectName: name,
    },
  ];
}

module.exports = { generateCustomObjectTools, sanitizeName };
