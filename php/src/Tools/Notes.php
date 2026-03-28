<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Notes
{
    public static function create_note(object $client, array $params): array
    {
        $body = [
            'objectID' => 12,
            'contact_id' => $params['contact_id'],
            'data' => $params['data'],
        ];
        if (isset($params['owner'])) {
            $body['owner'] = $params['owner'];
        }
        return $client->post('/objects', $body);
    }

    public static function get_notes(object $client, array $params): array
    {
        $query = ['objectID' => 12];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/objects', $query);
    }
}
