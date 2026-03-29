<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

class Registry
{
    private const STATIC_HANDLERS = [
        'get_contact' => [Contacts::class, 'get_contact'],
        'search_contacts' => [Contacts::class, 'search_contacts'],
        'create_contact' => [Contacts::class, 'create_contact'],
        'merge_or_create_contact' => [Contacts::class, 'merge_or_create_contact'],
        'update_contact' => [Contacts::class, 'update_contact'],
        'delete_contact' => [Contacts::class, 'delete_contact'],
        'get_contact_count' => [Contacts::class, 'get_contact_count'],
        'add_tag_by_name' => [Tags::class, 'add_tag_by_name'],
        'remove_tag_by_name' => [Tags::class, 'remove_tag_by_name'],
        'add_tag_by_id' => [Tags::class, 'add_tag_by_id'],
        'remove_tag_by_id' => [Tags::class, 'remove_tag_by_id'],
        'get_contacts_by_tag' => [Tags::class, 'get_contacts_by_tag'],
        'list_tags' => [Tags::class, 'list_tags'],
        'subscribe_to_sequence' => [Sequences::class, 'subscribe_to_sequence'],
        'unsubscribe_from_sequence' => [Sequences::class, 'unsubscribe_from_sequence'],
        'pause_rules_and_sequences' => [Sequences::class, 'pause_rules_and_sequences'],
        'unpause_rules_and_sequences' => [Sequences::class, 'unpause_rules_and_sequences'],
        'assign_task' => [Tasks::class, 'assign_task'],
        'complete_task' => [Tasks::class, 'complete_task'],
        'cancel_task' => [Tasks::class, 'cancel_task'],
        'update_task' => [Tasks::class, 'update_task'],
        'get_tasks' => [Tasks::class, 'get_tasks'],
        'reschedule_task' => [Tasks::class, 'reschedule_task'],
        'create_note' => [Notes::class, 'create_note'],
        'get_notes' => [Notes::class, 'get_notes'],
        'get_messages' => [Messages::class, 'get_messages'],
        'get_message' => [Messages::class, 'get_message'],
        'get_purchases' => [Purchases::class, 'get_purchases'],
        'get_purchase_logs' => [Purchases::class, 'get_purchase_logs'],
        'get_transactions' => [Purchases::class, 'get_transactions'],
        'get_orders' => [Purchases::class, 'get_orders'],
        'get_open_orders' => [Purchases::class, 'get_open_orders'],
        'refund_transaction' => [Transactions::class, 'refund_transaction'],
        'void_transaction' => [Transactions::class, 'void_transaction'],
        'write_off_transaction' => [Transactions::class, 'write_off_transaction'],
        'mark_transaction_paid' => [Transactions::class, 'mark_transaction_paid'],
        'rerun_transaction' => [Transactions::class, 'rerun_transaction'],
        'resend_invoice' => [Transactions::class, 'resend_invoice'],
        'cancel_subscription' => [Transactions::class, 'cancel_subscription'],
        'delete_order' => [Transactions::class, 'delete_order'],
        'convert_to_collections' => [Transactions::class, 'convert_to_collections'],
        'process_transaction' => [Transactions::class, 'process_transaction'],
        'log_transaction' => [Transactions::class, 'log_transaction'],
        'create_invoice' => [Transactions::class, 'create_invoice'],
        'pay_invoice' => [Transactions::class, 'pay_invoice'],
        'get_order' => [Transactions::class, 'get_order'],
        'update_order' => [Transactions::class, 'update_order'],
        'list_products' => [Products::class, 'list_products'],
        'get_product' => [Products::class, 'get_product'],
        'get_object_meta' => [Metadata::class, 'get_object_meta'],
        'get_collection_count' => [Metadata::class, 'get_collection_count'],
    ];

    private const CUSTOM_OPS = ['get', 'create', 'update', 'search'];
    private const CUSTOM_HANDLER_MAP = [
        'get' => 'get_custom_object',
        'create' => 'create_custom_object',
        'update' => 'update_custom_object',
        'search' => 'search_custom_object',
    ];

    /**
     * @return array|null ['operation' => string, 'suffix' => string]
     */
    public static function parseCustomToolName(string $toolName): ?array
    {
        foreach (self::CUSTOM_OPS as $op) {
            $prefix = "{$op}_";
            if (strncmp($toolName, $prefix, strlen($prefix)) === 0) {
                $suffix = substr($toolName, strlen($prefix));
                if (!isset(self::STATIC_HANDLERS[$toolName]) && $suffix !== '') {
                    return ['operation' => $op, 'suffix' => $suffix];
                }
            }
        }
        return null;
    }

    /**
     * @param string $toolName
     * @param array<string, int> $customObjectMap
     * @return callable|null
     */
    public static function getHandler(string $toolName, array $customObjectMap = []): ?callable
    {
        if (isset(self::STATIC_HANDLERS[$toolName])) {
            $handler = self::STATIC_HANDLERS[$toolName];
            return function ($client, array $params) use ($handler) {
                return call_user_func($handler, $client, $params);
            };
        }

        $parsed = self::parseCustomToolName($toolName);
        if ($parsed !== null && isset($customObjectMap[$parsed['suffix']])) {
            $objectTypeId = $customObjectMap[$parsed['suffix']];
            $method = self::CUSTOM_HANDLER_MAP[$parsed['operation']];
            return function ($client, array $params) use ($method, $objectTypeId) {
                return CustomObjects::$method($client, $params, $objectTypeId);
            };
        }

        return null;
    }
}
