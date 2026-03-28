const contacts = require('./contacts');
const tags = require('./tags');
const sequences = require('./sequences');
const tasks = require('./tasks');
const notes = require('./notes');
const messages = require('./messages');
const purchases = require('./purchases');
const transactions = require('./transactions');
const products = require('./products');
const customObjects = require('./custom-objects');
const metadata = require('./metadata');

// Static tool name → handler mapping
const staticHandlers = {
  // Contacts
  get_contact: contacts.get_contact,
  search_contacts: contacts.search_contacts,
  create_contact: contacts.create_contact,
  merge_or_create_contact: contacts.merge_or_create_contact,
  update_contact: contacts.update_contact,
  delete_contact: contacts.delete_contact,
  get_contact_count: contacts.get_contact_count,

  // Tags
  add_tag_by_name: tags.add_tag_by_name,
  remove_tag_by_name: tags.remove_tag_by_name,
  add_tag_by_id: tags.add_tag_by_id,
  remove_tag_by_id: tags.remove_tag_by_id,
  get_contacts_by_tag: tags.get_contacts_by_tag,
  list_tags: tags.list_tags,

  // Sequences & Campaigns
  subscribe_to_sequence: sequences.subscribe_to_sequence,
  unsubscribe_from_sequence: sequences.unsubscribe_from_sequence,
  pause_rules_and_sequences: sequences.pause_rules_and_sequences,
  unpause_rules_and_sequences: sequences.unpause_rules_and_sequences,

  // Tasks
  assign_task: tasks.assign_task,
  complete_task: tasks.complete_task,
  cancel_task: tasks.cancel_task,
  update_task: tasks.update_task,
  get_tasks: tasks.get_tasks,

  // Notes
  create_note: notes.create_note,
  get_notes: notes.get_notes,

  // Messages
  get_messages: messages.get_messages,
  get_message: messages.get_message,

  // Purchases & Orders (Read)
  get_purchases: purchases.get_purchases,
  get_purchase_logs: purchases.get_purchase_logs,
  get_transactions: purchases.get_transactions,
  get_orders: purchases.get_orders,
  get_open_orders: purchases.get_open_orders,

  // Transactions (Write)
  refund_transaction: transactions.refund_transaction,
  void_transaction: transactions.void_transaction,
  write_off_transaction: transactions.write_off_transaction,
  mark_transaction_paid: transactions.mark_transaction_paid,
  rerun_transaction: transactions.rerun_transaction,
  resend_invoice: transactions.resend_invoice,

  // Products
  list_products: products.list_products,
  get_product: products.get_product,

  // Metadata
  get_object_meta: metadata.get_object_meta,
  get_collection_count: metadata.get_collection_count,
};

// Custom object operation prefixes
const CUSTOM_OPS = ['get', 'create', 'update', 'search'];
const CUSTOM_HANDLERS = {
  get: customObjects.get_custom_object,
  create: customObjects.create_custom_object,
  update: customObjects.update_custom_object,
  search: customObjects.search_custom_object,
};

/**
 * Parse a tool name to extract a custom object operation and object suffix.
 * Returns { operation, suffix } or null if not a custom object pattern.
 */
function parseCustomToolName(toolName) {
  for (const op of CUSTOM_OPS) {
    const prefix = `${op}_`;
    if (toolName.startsWith(prefix)) {
      const suffix = toolName.slice(prefix.length);
      if (!staticHandlers[toolName] && suffix.length > 0) {
        return { operation: op, suffix };
      }
    }
  }
  return null;
}

/**
 * Get a handler for a tool. For static tools returns immediately.
 * For custom object tools, looks up the objectTypeId from the cached
 * customObjectMap (built during tools/list) — no extra API call.
 *
 * @param {string} toolName
 * @param {Map<string, number>} customObjectMap - safeName → objectTypeId, from buildManifest
 * @returns {Function|null} handler function (client, params) => result
 */
function getHandler(toolName, customObjectMap) {
  // Check static handlers first
  if (staticHandlers[toolName]) {
    return staticHandlers[toolName];
  }

  // Try to resolve as a custom object tool using the cached map
  const parsed = parseCustomToolName(toolName);
  if (parsed && customObjectMap) {
    const objectTypeId = customObjectMap.get(parsed.suffix);
    if (objectTypeId !== undefined) {
      const handler = CUSTOM_HANDLERS[parsed.operation];
      return (client, params) => handler(client, params, objectTypeId);
    }
  }

  return null;
}

module.exports = {
  getHandler,
  staticHandlers,
  parseCustomToolName,
};
