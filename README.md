# Ontraport MCP Server

A stateless Node.js service that implements the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) to expose Ontraport CRM functionality as structured tools consumable by any MCP-compatible AI agent.

The server is a **translation layer**. It receives tool calls from AI agents, authenticates them against Ontraport API credentials, translates them into the appropriate Ontraport REST API calls, cleans the responses, and returns structured results. It contains no business logic of its own.

---

## Table of Contents

- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [How It Works](#how-it-works)
  - [Request Lifecycle](#request-lifecycle)
  - [Dynamic Manifest Generation](#dynamic-manifest-generation)
  - [Tool Execution](#tool-execution)
  - [Response Cleaning](#response-cleaning)
- [Project Structure](#project-structure)
- [Tool Reference](#tool-reference)
  - [Contacts (7 tools)](#contacts-7-tools)
  - [Tags (6 tools)](#tags-6-tools)
  - [Sequences & Campaigns (4 tools)](#sequences--campaigns-4-tools)
  - [Tasks (5 tools)](#tasks-5-tools)
  - [Notes (2 tools)](#notes-2-tools)
  - [Messages (2 tools)](#messages-2-tools)
  - [Purchases & Orders (5 tools)](#purchases--orders-5-tools)
  - [Transactions Write (12 tools)](#transactions-write-12-tools)
  - [Products (2 tools)](#products-2-tools)
  - [Custom Objects (4 tools per object)](#custom-objects-4-tools-per-object)
  - [Metadata & Discovery (2 tools)](#metadata--discovery-2-tools)
- [Input Reference](#input-reference)
  - [Condition Parameter](#condition-parameter)
  - [Pagination](#pagination)
  - [Timestamps](#timestamps)
  - [List Selection Fields](#list-selection-fields)
- [Error Handling](#error-handling)
- [Manifest Size Guard](#manifest-size-guard)
- [Rate Limiting](#rate-limiting)
- [Security](#security)
- [Testing](#testing)
- [Configuration](#configuration)
- [What Is Excluded from v1](#what-is-excluded-from-v1)

---

## Architecture

```
┌─────────────────┐       ┌──────────────────────────┐       ┌──────────────────┐
│                 │       │   Ontraport MCP Server   │       │                  │
│   AI Agent      │──────▶│                          │──────▶│  Ontraport API   │
│  (any MCP       │  POST │  1. Validate auth        │  HTTP │                  │
│   compatible)   │  /v1  │  2. Route JSON-RPC       │       │  api.ontraport   │
│                 │◀──────│  3. Translate to REST     │◀──────│  .com/1/...      │
│                 │       │  4. Clean response        │       │                  │
└─────────────────┘       └──────────────────────────┘       └──────────────────┘
```

**Key properties:**

- **Built on the official MCP SDK** — Uses `@modelcontextprotocol/sdk` with `StreamableHTTPServerTransport` for protocol-compliant transport and session management.
- **Stateless** — No database, no persistent session storage, no caching. All state lives in Ontraport. In-memory sessions track only the MCP transport lifecycle.
- **Full MCP endpoint** — `POST /v1` for requests, `GET /v1` for SSE notification streams, `DELETE /v1` for session termination. Plus `GET /v1/health` for monitoring.
- **Per-session isolation** — Each agent connection gets its own `Server` + `Transport` pair scoped to its credentials. No cross-session state leakage.
- **Dynamic manifest** — The tool list is generated fresh on every `tools/list` call by querying the Ontraport account's object metadata.
- **Credential passthrough** — The server forwards `Api-Key` and `Api-Appid` headers directly to the Ontraport API. It never stores, caches, or logs credentials.

---

## Getting Started

### Prerequisites

- Node.js 18+ (uses native `fetch`)

### Install & Run

```bash
npm install
npm start
```

The server starts on port 3000 by default. Set the `PORT` environment variable to change it.

### Health Check

```bash
curl http://localhost:3000/v1/health
# {"status":"ok"}
```

This endpoint requires no authentication and is intended for uptime monitoring.

### Quick Test — Initialize

```bash
curl -X POST http://localhost:3000/v1 \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Api-Key: YOUR_API_KEY" \
  -H "Api-Appid: YOUR_APP_ID" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0"},"capabilities":{}}}'
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": { "name": "ontraport-mcp-server", "version": "1.0.0" },
    "capabilities": { "tools": {} }
  }
}
```

---

## Authentication

Every request to `POST /v1` must include two HTTP headers:

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Api-Key` | string | Yes | The Ontraport account's API key, scoped to the desired permissions. |
| `Api-Appid` | string | Yes | The Ontraport account's unique App ID. |

If either header is missing, the server responds with HTTP 401 before making any downstream calls.

The server passes these credentials directly to the Ontraport API on every call. Permission scoping is enforced by Ontraport's existing API key scope system — if a key lacks a required scope, the Ontraport API returns an error and the MCP server surfaces it cleanly.

---

## How It Works

### Request Lifecycle

Every request follows the same path:

```
Agent sends JSON-RPC request to POST /v1
  ↓
Express validates Api-Key + Api-Appid headers (401 if missing)
  ↓
Looks up or creates a session (Server + StreamableHTTPServerTransport pair)
  ↓
SDK handles JSON-RPC framing, protocol negotiation, and method routing:
  • initialize     → returns server info + capabilities (handled by SDK)
  • tools/list     → our handler builds dynamic manifest via /objects/meta
  • tools/call     → our handler dispatches to tool implementation
  ↓
Tool handler:
  1. Validates input parameters
  2. Constructs Ontraport API request
  3. Executes via OntraportClient with provided credentials
  4. Cleans response (strips noise fields)
  5. Returns structured result
```

The SDK's `StreamableHTTPServerTransport` handles the full MCP Streamable HTTP spec including session management (`Mcp-Session-Id` header), SSE streaming for server notifications (`GET /v1`), and session termination (`DELETE /v1`).

### Dynamic Manifest Generation

Not all Ontraport accounts have the same objects. Customers can create custom objects, each with its own API endpoints and unique object type ID. Because of this, the tool manifest cannot be static.

When an agent calls `tools/list`, the server:

1. Calls `GET /objects/meta` on the Ontraport API using the agent's credentials
2. Identifies custom objects (anything not in the built-in object type ID list)
3. Generates 4 tool definitions per custom object (`get_`, `create_`, `update_`, `search_`)
4. Merges the 47 static tools with the dynamically generated custom object tools
5. Enforces the 100-tool manifest cap (see [Manifest Size Guard](#manifest-size-guard))
6. Returns the complete tool list

The manifest is **never cached**. Every `tools/list` call triggers a fresh `/objects/meta` request so the manifest always reflects the current state of the account.

If the `/objects/meta` call fails (bad credentials, Ontraport outage), the server returns an MCP error — it never returns a partial manifest.

### Tool Execution

When an agent calls `tools/call`, the server:

1. Looks up the tool name in the static handler registry
2. If not found, checks if the name matches a custom object pattern (`get_X`, `create_X`, `update_X`, `search_X`)
3. For custom object tools, calls `/objects/meta` to resolve the object's type ID dynamically — this means `tools/call` works independently of any prior `tools/list` call
4. Executes the handler, which translates the tool parameters into the appropriate Ontraport REST API call
5. Cleans the response and returns it in the MCP content format

This design is fully **stateless** — there is no global mutable state, no dependency between `tools/list` and `tools/call`, and concurrent requests from different accounts are safe.

### Response Cleaning

Before returning Ontraport API responses to agents, the server strips fields that add noise without value:

- `system_source`
- `source_location`
- `import_id`
- `bindex`
- `ip_addy` (deprecated)
- `ip_addy_display`
- `contact_cat` (deprecated)
- `updateSequence` (deprecated)
- `updateCampaign` (deprecated)
- `account_id` (the agent already knows which account it's connected to)

Cleaning is applied recursively to nested objects and arrays.

---

## Project Structure

```
src/
├── index.js                        # Express app: auth, session management, HTTP routing
├── errors.js                       # Structured error builders (400–500 taxonomy)
├── mcp/
│   └── server.js                   # MCP Server factory: creates per-session Server instances
│                                   #   with tools/list and tools/call handlers registered
├── manifest/
│   ├── static-tools.js             # All 42 static tool definitions (single source of truth)
│   ├── custom-object-tools.js      # Generates 4 tools per custom object
│   ├── builder.js                  # Merges static + dynamic tools, enforces 100-tool cap
│   └── builder-constants.js        # Built-in object type IDs (shared constant)
├── ontraport/
│   ├── client.js                   # HTTP client for the Ontraport REST API
│   └── response-cleaner.js         # Strips noise fields from API responses
└── tools/
    ├── registry.js                 # Tool name → handler dispatch (static + dynamic resolution)
    ├── contacts.js                 # 7 contact tools
    ├── tags.js                     # 6 tag tools
    ├── sequences.js                # 4 sequence/campaign tools
    ├── tasks.js                    # 5 task tools
    ├── notes.js                    # 2 note tools
    ├── messages.js                 # 2 message tools
    ├── purchases.js                # 5 purchase/order read tools
    ├── transactions.js             # 12 transaction write tools
    ├── products.js                 # 2 product tools
    ├── custom-objects.js           # Generic CRUD handlers for custom objects
    └── metadata.js                 # 2 metadata/discovery tools

test/
├── health.test.js                  # Health endpoint
├── auth.test.js                    # Authentication validation (SDK transport)
├── mcp-server.test.js              # MCP Server factory
├── error-handling.test.js          # Error taxonomy
├── response-cleaner.test.js        # Response cleaning
├── manifest.test.js                # Manifest generation, cap, truncation
└── tools/
    ├── contacts.test.js
    ├── tags.test.js
    ├── sequences.test.js
    ├── tasks.test.js
    ├── notes.test.js
    ├── messages.test.js
    ├── purchases.test.js
    ├── transactions.test.js
    ├── products.test.js
    ├── custom-objects.test.js
    └── metadata.test.js
```

### Design Principles

- **Single source of truth** — All tool definitions (names, descriptions, input schemas) live in `static-tools.js`. The manifest, input validation, and handler dispatch all derive from this one file.
- **One pattern** — Every tool handler follows the same shape: validate inputs, construct the Ontraport API call, execute it, return the result. Error handling is handled by the client and transport layers.
- **No abstraction without repetition** — Each tool module is a flat set of exported async functions. No base classes, no middleware chains, no framework beyond Express and the MCP SDK.

---

## Tool Reference

### Contacts (7 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `get_contact` | Retrieve a single contact by ID or email. | `GET /Contact` or `GET /object/getByEmail` |
| `search_contacts` | Search contacts by conditions, tags, or free text. Paginated (max 50). | `GET /Contacts` |
| `create_contact` | Create a new contact. Allows duplicate emails. | `POST /Contacts` |
| `merge_or_create_contact` | Find by email and update, or create if not found. Safest for agent use. | `POST /Contacts/saveorupdate` |
| `update_contact` | Update fields on an existing contact by ID. | `PUT /Contacts` |
| `delete_contact` | Permanently delete a contact. Cannot be undone. | `DELETE /Contact` |
| `get_contact_count` | Get total matching contacts without returning records. | `GET /Contacts/getInfo` |

### Tags (6 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `add_tag_by_name` | Apply tags by name. Auto-creates tags that don't exist. | `PUT /objects/tagByName` |
| `remove_tag_by_name` | Remove tags by name. Silently ignores nonexistent tags. | `DELETE /objects/tagByName` |
| `add_tag_by_id` | Apply tags by ID. | `PUT /objects/tag` |
| `remove_tag_by_id` | Remove tags by ID. | `DELETE /objects/tag` |
| `get_contacts_by_tag` | Get contacts with a specific tag (by name or ID). | `GET /objects/tag` |
| `list_tags` | List all tags in the account. | `GET /Tags` |

### Sequences & Campaigns (4 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `subscribe_to_sequence` | Enroll contacts in sequences or campaigns. | `PUT /objects/subscribe` |
| `unsubscribe_from_sequence` | Remove contacts from sequences or campaigns. | `DELETE /objects/subscribe` |
| `pause_rules_and_sequences` | Pause all automation for a contact. | `POST /objects/pause` |
| `unpause_rules_and_sequences` | Resume paused automation. | `POST /objects/unpause` |

### Tasks (5 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `assign_task` | Create and assign a task from a message template. | `POST /task/assign` |
| `complete_task` | Mark tasks as completed with optional outcome. | `POST /task/complete` |
| `cancel_task` | Cancel tasks (status 2, no longer actionable). | `POST /task/cancel` |
| `update_task` | Update assignee, due date, or status. | `PUT /Tasks` |
| `get_tasks` | Retrieve tasks with optional filtering. | `GET /Tasks` |

### Notes (2 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `create_note` | Create a note attached to a contact record. | `POST /objects` (objectID=12) |
| `get_notes` | Retrieve notes, optionally filtered by contact. | `GET /objects` (objectID=12) |

### Messages (2 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `get_messages` | List available email, SMS, and task messages. | `GET /Messages` |
| `get_message` | Get a single message with full content. | `GET /Message` |

### Purchases & Orders (5 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `get_purchases` | Retrieve purchase records. | `GET /Purchases` |
| `get_purchase_logs` | Retrieve purchase lifecycle logs. | `GET /PurchaseHistoryLogs` |
| `get_transactions` | Retrieve transaction/invoice records. | `GET /Transactions` |
| `get_orders` | Retrieve order records (subscriptions, payment plans). | `GET /Orders` |
| `get_open_orders` | Retrieve active subscription records. | `GET /OpenOrders` |

### Transactions Write (12 tools)

These tools modify financial records. Agents should confirm with the user before executing.

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `process_transaction` | Charge a contact's card on file. Requires offer with products and a saved card ID. Does NOT accept new card details. | `POST /transaction/processManual` |
| `log_transaction` | Record a transaction without charging (offline sales, cash, check). | `POST /transaction/processManual` (chargeNow=0) |
| `get_order` | Retrieve order details for a transaction (subscription schedule, next charge date). | `GET /transaction/order` |
| `update_order` | Update an order's next charge date, amount, or other fields. | `PUT /transaction/order` |
| `cancel_subscription` | Cancel active subscriptions by converting transactions to declined. Stops all future charges. | `PUT /transaction/convertToDecline` |
| `convert_to_collections` | Escalate overdue transactions to collections status. | `PUT /transaction/convertToCollections` |
| `refund_transaction` | Refund through original payment gateway. Cannot be undone. | `PUT /transaction/refund` |
| `void_transaction` | Void an unsettled transaction. | `PUT /transaction/void` |
| `write_off_transaction` | Write off unpaid transactions (bad debt). | `PUT /transaction/writeOff` |
| `mark_transaction_paid` | Mark as manually paid (check, cash, wire, etc.). | `PUT /transaction/markPaid` |
| `rerun_transaction` | Retry a declined/failed transaction. | `POST /transaction/rerun` |
| `resend_invoice` | Resend invoice email. | `POST /transaction/resendInvoice` |

### Products (2 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `list_products` | List all products in the account. | `GET /Products` |
| `get_product` | Get a single product by ID. | `GET /Product` |

### Custom Objects (4 tools per object)

These tools are **dynamically generated** for each custom object discovered in the account via `/objects/meta`. The tool names include the object's name, and the `object_type_id` is automatically injected.

| Pattern | Description | API Endpoint |
|---------|-------------|-------------|
| `get_[ObjectName]` | Retrieve a record by ID. | `GET /object` |
| `create_[ObjectName]` | Create a new record. `owner` is required. | `POST /objects` |
| `update_[ObjectName]` | Update fields on an existing record. | `PUT /objects` |
| `search_[ObjectName]` | Search by conditions, text, or tag. Paginated. | `GET /objects` |

### Metadata & Discovery (2 tools)

| Tool | Description | API Endpoint |
|------|-------------|-------------|
| `get_object_meta` | Get field definitions for any object type. | `GET /objects/meta` |
| `get_collection_count` | Get record count for any object with optional filtering. | `GET /objects/getInfo` |

---

## Input Reference

### Condition Parameter

The `condition` parameter is used across all search and list tools. It is a JSON-encoded string containing an array of criteria objects.

**Single condition:**

```json
[{"field":{"field":"lastname"},"op":"=","value":{"value":"Smith"}}]
```

**Supported operators:**

| Operator | Description |
|----------|-------------|
| `=` | Equal to. Works on text, numeric, and timestamp fields. |
| `>` | Greater than. Numeric and timestamp fields. |
| `<` | Less than. Numeric and timestamp fields. |
| `>=` | Greater than or equal to. |
| `<=` | Less than or equal to. |
| `IN` | Value is in a list. Value format: `{"list":[{"value":1},{"value":2}]}` |
| `CONTAINS` | For list-type fields. Checks if an option is assigned. |
| `DOES NOT CONTAIN` | For list-type fields. Checks if an option is not assigned. |

**Compound conditions:**

Insert `"AND"` or `"OR"` strings between criteria objects:

```json
[{"field":{"field":"lastname"},"op":"=","value":{"value":"Smith"}}, "AND", {"field":{"field":"city"},"op":"=","value":{"value":"Austin"}}]
```

### Pagination

All list/search tools support pagination:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `start` | integer | 0 | Zero-based offset. |
| `range` | integer | 50 | Number of records to return. Maximum 50. |
| `sort` | string | — | Field name to sort by. |
| `sortDir` | string | — | `"asc"` or `"desc"`. Must be used with `sort`. |

### Timestamps

All date/time fields use **Unix timestamps** (seconds since January 1, 1970 00:00:00 UTC). Agents must convert human-readable dates to Unix timestamps before passing them to any tool.

### List Selection Fields

Custom fields of the list selection type require option IDs wrapped with the `*/*` delimiter:

```
"f1500": "*/*1*/*2*/*"
```

Use `get_object_meta` to discover option IDs for list fields.

---

## Error Handling

The server translates Ontraport API errors into structured responses that give agents enough information to decide whether to retry, fix inputs, or report to the user.

| HTTP Code | Category | Agent Guidance |
|-----------|----------|----------------|
| 200 | Success | Parse the `data` field from the response. |
| 400 | Bad Request | Do not retry. Fix malformed input parameters. |
| 401 | Unauthorized | Invalid or missing credentials. Do not retry without new credentials. |
| 403 | Forbidden | API key lacks the required scope. Report to the user. |
| 404 | Not Found | Object ID doesn't exist. Verify IDs before retrying. |
| 422 | Unprocessable | Field validation failed (e.g., invalid email format). Fix and retry. |
| 429 | Rate Limited | Back off and retry. Check `Retry-After` header. Limit: 180 req/min/account. |
| 500 | Server Error | Retry with exponential backoff (max 3 attempts). |

Error response format:

```json
{
  "code": 400,
  "error": "bad_request",
  "message": "id is required for update_contact."
}
```

---

## Manifest Size Guard

If an account has many custom objects, the manifest can exceed what fits in an LLM's context window. The server enforces a maximum of **100 tools**:

1. All 47 static tools are always included
2. Custom objects are sorted by most recently modified
3. Custom object tools are included in groups of 4 (one complete object at a time) until the limit is reached
4. If truncated, a `_manifest_note` tool is added telling the agent that additional objects exist and can be discovered via `get_object_meta`

---

## Rate Limiting

The server does not add its own rate limiting. It inherits Ontraport's limit of **180 API requests per minute per account** transparently. When the limit is exceeded, the server returns HTTP 429 with the `Retry-After` header from Ontraport so the agent can back off appropriately.

---

## Security

- **Credential passthrough** — `Api-Key` and `Api-Appid` are forwarded to Ontraport on each call and never stored.
- **Session credential binding** — Sessions are bound to credentials via SHA-256 hash. Returning requests must present the same `Api-Key`/`Api-Appid` that created the session. Prevents session hijacking across accounts.
- **Auth on all endpoints** — `Api-Key` and `Api-Appid` headers are validated on every request — POST, GET (SSE), and DELETE — not just session creation.
- **Per-session isolation** — Each agent connection gets its own `Server` instance scoped to its credentials. No shared mutable state between sessions.
- **Session TTL** — Abandoned sessions are automatically cleaned up after 30 minutes of inactivity. A background sweep runs every 5 minutes to prevent memory leaks.
- **No logging of credentials** — Error handlers log only `err.message`, never full error objects that could contain credentials in stack traces.
- **No persistence** — The server has no database, no file storage. In-memory sessions track only the MCP transport lifecycle.
- **Scope enforcement** — Permissions are enforced by Ontraport's existing API key scope system. If a key lacks a scope, the API call fails and the server surfaces the error.

---

## Testing

```bash
npm test
```

The test suite includes **102 tests across 17 suites**:

| Suite | Coverage |
|-------|----------|
| `health.test.js` | Health endpoint returns 200, no auth required |
| `auth.test.js` | Missing headers → 401, valid auth + SDK initialize → 200 |
| `mcp-server.test.js` | Server factory creates isolated per-credential instances |
| `error-handling.test.js` | All error types, toJSON format, fromHttpStatus mapping |
| `response-cleaner.test.js` | Strips all 10 noise fields, recursive cleaning, null handling |
| `manifest.test.js` | Static tools, custom objects, built-in ID exclusion, 100-tool cap, truncation at object boundaries, no internal field leaks, failure propagation |
| `tools/contacts.test.js` | All 7 contact tools — correct endpoints, params, validation |
| `tools/tags.test.js` | All 6 tag tools — correct payloads, objectID injection |
| `tools/sequences.test.js` | All 4 sequence tools — sub_type defaults, correct methods |
| `tools/tasks.test.js` | All 5 task tools — correct body structure |
| `tools/notes.test.js` | Both note tools — objectID=12 injection |
| `tools/messages.test.js` | All 2 message tools — correct endpoints |
| `tools/purchases.test.js` | All 5 purchase/order tools — correct endpoints |
| `tools/transactions.test.js` | All 12 transaction write tools — correct methods and paths |
| `tools/products.test.js` | Both product tools — correct endpoints |
| `tools/custom-objects.test.js` | All 4 custom object operations — objectID injection, validation |
| `tools/metadata.test.js` | Both metadata tools — parameter passthrough |

---

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3000` | The port the server listens on. |

---

## What Is Excluded from v1

The following are intentionally excluded and may be considered for future versions:

| Feature | Reason |
|---------|--------|
| Campaign Builder | High complexity, risk of account misconfiguration |
| Forms | Low demand for agent use cases |
| Webhooks | Push-based pattern, separate architecture |
| Bulk Operations | Safety review needed for agentic blast radius |
| Calendar Events | Keeping manifest focused on CRM and commerce |
| Inbox / Conversations | Requires messaging infrastructure context |
| Credit Card Management | Security-sensitive, needs confirmation flows |
| processManual (new transactions) | Financial risk, complex offer/product construction |

---

## Object Type ID Reference

| Object | Type ID |
|--------|---------|
| Contact | 0 |
| Task | 1 |
| Group | 3 |
| Sequence | 5 |
| Rule | 6 |
| Message | 7 |
| Note | 12 |
| Tag | 14 |
| Product | 16 |
| Purchase | 17 |
| Purchase History Log | 30 |
| Open Order | 44 |
| Transaction | 46 |
| Order | 52 |
| Tag Subscriber | 138 |
| Campaign/Automation | 140 |

Custom objects have IDs assigned dynamically and are discovered via `/objects/meta`.
