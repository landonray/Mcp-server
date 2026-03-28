const STRIPPED_FIELDS = new Set([
  'system_source',
  'source_location',
  'import_id',
  'bindex',
  'ip_addy',
  'ip_addy_display',
  'contact_cat',
  'updateSequence',
  'updateCampaign',
  'account_id',
]);

function cleanValue(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(cleanValue);
  }
  if (typeof value === 'object') {
    return cleanObject(value);
  }
  return value;
}

function cleanObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanValue);
  }
  if (typeof obj !== 'object') {
    return obj;
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (STRIPPED_FIELDS.has(key)) {
      continue;
    }
    cleaned[key] = cleanValue(value);
  }
  return cleaned;
}

function cleanResponse(data) {
  if (data === null || data === undefined) {
    return data;
  }

  // Remove account_id wrapper if present at the top level
  const cleaned = cleanObject(data);

  // If the response has a data field, clean it recursively
  if (cleaned.data) {
    cleaned.data = cleanValue(cleaned.data);
  }

  return cleaned;
}

module.exports = { cleanResponse, cleanObject, STRIPPED_FIELDS };
