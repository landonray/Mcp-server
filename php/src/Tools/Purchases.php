<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Purchases
{
    public static function get_purchases(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Purchases', $query);
    }

    public static function get_purchase_logs(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/PurchaseHistoryLogs', $query);
    }

    public static function get_transactions(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['sort'])) $query['sort'] = $params['sort'];
        if (isset($params['sortDir'])) $query['sortDir'] = $params['sortDir'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Transactions', $query);
    }

    public static function get_orders(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Orders', $query);
    }

    public static function get_open_orders(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/OpenOrders', $query);
    }
}
