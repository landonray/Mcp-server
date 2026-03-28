<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Metadata
{
    public static function get_object_meta(object $client, array $params): array
    {
        $query = [];
        if (isset($params['objectID'])) $query['objectID'] = $params['objectID'];
        if (isset($params['format'])) $query['format'] = $params['format'];
        return $client->get('/objects/meta', $query);
    }

    public static function get_collection_count(object $client, array $params): array
    {
        $query = ['objectID' => $params['objectID']];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['search'])) $query['search'] = $params['search'];
        return $client->get('/objects/getInfo', $query);
    }
}
