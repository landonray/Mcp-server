// Built-in object type IDs that are already covered by static tools.
// Shared between manifest builder and tool registry.
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

module.exports = { BUILTIN_OBJECT_TYPE_IDS };
