const { staticTools } = require('./static-tools');
const { generateCustomObjectTools, sanitizeName } = require('./custom-object-tools');
const { registerCustomObject, clearCustomObjects } = require('../tools/registry');

// Built-in object type IDs that are already covered by static tools
const BUILTIN_OBJECT_TYPE_IDS = new Set([
  0,   // Contact
  1,   // Task
  3,   // Group
  5,   // Sequence
  6,   // Rule
  7,   // Message
  12,  // Note
  14,  // Tag
  16,  // Product
  17,  // Purchase
  30,  // Purchase History Log
  44,  // Open Order
  46,  // Transaction
  52,  // Order
  138, // Tag Subscriber
  140, // Campaign/Automation
]);

const MAX_MANIFEST_TOOLS = 100;

async function buildManifest(client) {
  // Fetch object metadata — this call must succeed or we fail completely
  const metaResponse = await client.get('/objects/meta');

  const objectMeta = metaResponse.data || metaResponse;

  // Build static tools (strip internal fields like 'module')
  const staticManifest = staticTools.map(toolToManifestEntry);

  // Discover custom objects
  const customObjects = [];
  for (const [typeId, meta] of Object.entries(objectMeta)) {
    const id = parseInt(typeId, 10);
    if (BUILTIN_OBJECT_TYPE_IDS.has(id)) continue;
    if (!meta || !meta.name) continue;

    customObjects.push({
      name: meta.name,
      objectTypeId: id,
      lastModified: meta.last_modified || meta.dlm || 0,
    });
  }

  // Sort custom objects by most recently modified (descending)
  customObjects.sort((a, b) => {
    const aTime = parseInt(a.lastModified, 10) || 0;
    const bTime = parseInt(b.lastModified, 10) || 0;
    return bTime - aTime;
  });

  // Clear previous custom object registrations and generate new ones
  clearCustomObjects();

  let customToolEntries = [];
  for (const obj of customObjects) {
    const tools = generateCustomObjectTools(obj);
    const safeName = sanitizeName(obj.name);

    // Register each custom object tool in the handler registry
    registerCustomObject(`get_${safeName}`, obj.objectTypeId, 'get');
    registerCustomObject(`create_${safeName}`, obj.objectTypeId, 'create');
    registerCustomObject(`update_${safeName}`, obj.objectTypeId, 'update');
    registerCustomObject(`search_${safeName}`, obj.objectTypeId, 'search');

    customToolEntries.push(...tools.map(toolToManifestEntry));
  }

  // Enforce 100-tool cap
  const staticCount = staticManifest.length;
  const availableSlots = MAX_MANIFEST_TOOLS - staticCount;
  let truncated = false;

  if (customToolEntries.length > availableSlots) {
    customToolEntries = customToolEntries.slice(0, availableSlots);
    truncated = true;
  }

  const manifest = [...staticManifest, ...customToolEntries];

  // If truncated, add a note tool so the agent knows
  if (truncated) {
    manifest.push({
      name: '_manifest_note',
      description: `This account has additional custom objects that were omitted to keep the manifest within size limits. You can use get_object_meta to discover all available objects, and request a specific custom object by name.`,
      inputSchema: { type: 'object', properties: {} },
    });
  }

  return manifest;
}

function toolToManifestEntry(tool) {
  const entry = {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  };
  // Preserve objectTypeId for dynamic dispatch in the registry
  if (tool.objectTypeId !== undefined) {
    entry._objectTypeId = tool.objectTypeId;
    entry._objectName = tool.objectName;
  }
  return entry;
}

module.exports = { buildManifest, BUILTIN_OBJECT_TYPE_IDS, MAX_MANIFEST_TOOLS };
