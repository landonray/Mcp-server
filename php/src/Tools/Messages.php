<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Messages
{
    public static function get_messages(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Messages', $query);
    }

    public static function get_message(object $client, array $params): array
    {
        return $client->get('/Message', ['id' => $params['id']]);
    }
}
