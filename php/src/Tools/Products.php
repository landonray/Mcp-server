<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Products
{
    public static function list_products(object $client, array $params): array
    {
        $query = [];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Products', $query);
    }

    public static function get_product(object $client, array $params): array
    {
        return $client->get('/Product', ['id' => $params['id']]);
    }
}
