<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\McpError;
use OntraportMcp\Ontraport\Client;

class Transactions
{
    public static function refund_transaction(object $client, array $params): array
    {
        return $client->put('/transaction/refund', ['ids' => $params['ids']]);
    }

    public static function void_transaction(object $client, array $params): array
    {
        return $client->put('/transaction/void', ['ids' => $params['ids']]);
    }

    public static function write_off_transaction(object $client, array $params): array
    {
        return $client->put('/transaction/writeOff', ['ids' => $params['ids']]);
    }

    public static function mark_transaction_paid(object $client, array $params): array
    {
        $body = ['id' => $params['id']];
        if (isset($params['type'])) $body['type'] = $params['type'];
        return $client->put('/transaction/markPaid', $body);
    }

    public static function rerun_transaction(object $client, array $params): array
    {
        return $client->post('/transaction/rerun', ['ids' => $params['ids']]);
    }

    public static function resend_invoice(object $client, array $params): array
    {
        return $client->post('/transaction/resendInvoice', ['ids' => $params['ids']]);
    }

    public static function cancel_subscription(object $client, array $params): array
    {
        if (empty($params['ids'])) {
            throw McpError::badRequest('ids (array of order IDs) is required for cancel_subscription.');
        }
        $results = [];
        foreach ($params['ids'] as $id) {
            $results[] = $client->delete('/order', ['id' => $id]);
        }
        return count($results) === 1 ? $results[0] : ['data' => $results];
    }

    public static function delete_order(object $client, array $params): array
    {
        if (!isset($params['id'])) {
            throw McpError::badRequest('id is required for delete_order.');
        }
        return $client->delete('/order', ['id' => $params['id']]);
    }

    public static function convert_to_collections(object $client, array $params): array
    {
        return $client->put('/transaction/convertToCollections', ['ids' => $params['ids']]);
    }

    public static function process_transaction(object $client, array $params): array
    {
        if (empty($params['contact_id'])) {
            throw McpError::badRequest('contact_id is required for process_transaction.');
        }
        if (empty($params['offer'])) {
            throw McpError::badRequest('offer is required for process_transaction.');
        }
        if (empty($params['gateway_id'])) {
            throw McpError::badRequest('gateway_id is required for process_transaction.');
        }

        $body = [
            'contact_id' => $params['contact_id'],
            'chargeNow' => 'chargeNow',
            'offer' => $params['offer'],
            'gateway_id' => $params['gateway_id'],
            'invoice_template' => $params['invoice_template'] ?? 1,
        ];

        if (isset($params['cc_id'])) $body['cc_id'] = $params['cc_id'];
        if (isset($params['billing_address'])) $body['billing_address'] = $params['billing_address'];
        if (isset($params['trans_date'])) $body['trans_date'] = $params['trans_date'];
        if (isset($params['external_order_id'])) $body['external_order_id'] = $params['external_order_id'];

        return $client->post('/transaction/processManual', $body);
    }

    public static function log_transaction(object $client, array $params): array
    {
        if (empty($params['contact_id'])) {
            throw McpError::badRequest('contact_id is required for log_transaction.');
        }
        if (empty($params['offer'])) {
            throw McpError::badRequest('offer is required for log_transaction.');
        }

        $body = [
            'contact_id' => $params['contact_id'],
            'chargeNow' => 'chargeLog',
            'offer' => $params['offer'],
        ];
        if (isset($params['invoice_template'])) $body['invoice_template'] = $params['invoice_template'];
        if (isset($params['trans_date'])) $body['trans_date'] = $params['trans_date'];
        if (isset($params['external_order_id'])) $body['external_order_id'] = $params['external_order_id'];

        return $client->post('/transaction/processManual', $body);
    }

    public static function create_invoice(object $client, array $params): array
    {
        if (empty($params['contact_id'])) {
            throw McpError::badRequest('contact_id is required for create_invoice.');
        }
        if (empty($params['gateway_id'])) {
            throw McpError::badRequest('gateway_id is required for create_invoice.');
        }
        if (empty($params['offer'])) {
            throw McpError::badRequest('offer is required for create_invoice.');
        }

        $body = [
            'contact_id' => $params['contact_id'],
            'chargeNow' => 'requestPayment',
            'gateway_id' => $params['gateway_id'],
            'offer' => $params['offer'],
        ];
        if (isset($params['send_invoice'])) $body['send_invoice'] = $params['send_invoice'];
        if (isset($params['trans_date'])) $body['trans_date'] = $params['trans_date'];
        if (isset($params['due_on'])) $body['due_on'] = $params['due_on'];
        if (isset($params['customer_note'])) $body['customer_note'] = $params['customer_note'];
        if (isset($params['internal_note'])) $body['internal_note'] = $params['internal_note'];
        if (isset($params['to_field'])) $body['to_field'] = $params['to_field'];
        if (isset($params['from_fields'])) $body['from_fields'] = $params['from_fields'];

        return $client->post('/transaction/requestPayment', $body);
    }

    public static function pay_invoice(object $client, array $params): array
    {
        if (empty($params['invoice_id'])) {
            throw McpError::badRequest('invoice_id is required for pay_invoice.');
        }
        $body = ['invoice_id' => $params['invoice_id']];
        if (isset($params['cc_id'])) $body['cc_id'] = $params['cc_id'];
        return $client->post('/transaction/payInvoice', $body);
    }

    public static function get_order(object $client, array $params): array
    {
        if (!isset($params['id'])) {
            throw McpError::badRequest('id is required for get_order.');
        }
        return $client->get('/transaction/order', ['id' => $params['id']]);
    }

    public static function update_order(object $client, array $params): array
    {
        if (empty($params['offer'])) {
            throw McpError::badRequest('offer is required for update_order. WARNING: omitting offer data deletes the order.');
        }
        if (empty($params['offer']['order_id'])) {
            throw McpError::badRequest('offer.order_id is required for update_order.');
        }
        if (empty($params['offer']['offer_id'])) {
            throw McpError::badRequest('offer.offer_id is required for update_order.');
        }
        return $client->put('/transaction/order', ['offer' => $params['offer']]);
    }
}
