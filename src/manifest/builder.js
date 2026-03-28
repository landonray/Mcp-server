const { staticTools } = require('./static-tools');
const { generateCustomObjectTools, sanitizeName } = require('./custom-object-tools');
const { BUILTIN_OBJECT_TYPE_IDS } = require('./builder-constants');

const MAX_MANIFEST_TOOLS = 100;
const TOOLS_PER_CUSTOM_OBJECT = 4;

/**
 * Build the tool manifest and a custom object lookup map.
 * Returns { tools, customObjectMap } where customObjectMap is
 * a Map<safeName, objectTypeId> for fast dispatch at call time.
 */
async function buildManifest(client) {
  // Fetch object metadata — this call must succeed or we fail completely
  const metaResponse = await client.get('/objects/meta');

  const objectMeta = metaResponse.data || metaResponse;

  // Build static tools (strip internal fields like 'module')
  const staticManifest = staticTools.map(toolToManifestEntry);

  // Discover custom objects and build the name→typeId map
  const customObjects = [];
  const customObjectMap = new Map();

  for (const [typeId, meta] of Object.entries(objectMeta)) {
    const id = parseInt(typeId, 10);
    if (BUILTIN_OBJECT_TYPE_IDS.has(id)) continue;
    if (!meta || !meta.name) continue;

    const safeName = sanitizeName(meta.name);
    customObjectMap.set(safeName, id);

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

  // Enforce 100-tool cap at whole-object boundaries (4 tools per object)
  const staticCount = staticManifest.length;
  const availableSlots = MAX_MANIFEST_TOOLS - staticCount;
  const maxCustomObjects = Math.floor(availableSlots / TOOLS_PER_CUSTOM_OBJECT);
  let truncated = false;

  let includedCustomObjects = customObjects;
  if (customObjects.length > maxCustomObjects) {
    includedCustomObjects = customObjects.slice(0, maxCustomObjects);
    truncated = true;
  }

  // Generate custom object tools only for included objects
  let customToolEntries = [];
  for (const obj of includedCustomObjects) {
    const tools = generateCustomObjectTools(obj);
    customToolEntries.push(...tools.map(toolToManifestEntry));
  }

  const tools = [...staticManifest, ...customToolEntries];

  // If truncated, add a note tool so the agent knows
  if (truncated) {
    tools.push({
      name: '_manifest_note',
      description: `This account has additional custom objects that were omitted to keep the manifest within size limits. You can use get_object_meta to discover all available objects, and request a specific custom object by name.`,
      inputSchema: { type: 'object', properties: {} },
    });
  }

  // Return both the manifest and the full custom object map
  // (map includes ALL custom objects, not just the truncated set,
  // so tools/call can dispatch to any custom object the agent knows about)
  return { tools, customObjectMap };
}

function toolToManifestEntry(tool) {
  // Only expose name, description, and inputSchema to agents.
  // Internal fields (module, objectTypeId, objectName) are stripped.
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  };
}

module.exports = { buildManifest, BUILTIN_OBJECT_TYPE_IDS, MAX_MANIFEST_TOOLS };
