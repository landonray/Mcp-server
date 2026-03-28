<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\McpError;
use OntraportMcp\Ontraport\Client;

class CustomObjects
{
    public static function get_custom_object(object $client, array $params, int $objectTypeId): array
    {
        if (!isset($params['id'])) {
            throw McpError::badRequest('id is required.');
        }
        return $client->get('/object', ['objectID' => $objectTypeId, 'id' => $params['id']]);
    }

    public static function create_custom_object(object $client, array $params, int $objectTypeId): array
    {
        return $client->post('/objects', array_merge(['objectID' => $objectTypeId], $params));
    }

    public static function update_custom_object(object $client, array $params, int $objectTypeId): array
    {
        if (!isset($params['id'])) {
            throw McpError::badRequest('id is required.');
        }
        return $client->put('/objects', array_merge(['objectID' => $objectTypeId], $params));
    }

    public static function search_custom_object(object $client, array $params, int $objectTypeId): array
    {
        $query = ['objectID' => $objectTypeId];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['search'])) $query['search'] = $params['search'];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['sort'])) $query['sort'] = $params['sort'];
        if (isset($params['sortDir'])) $query['sortDir'] = $params['sortDir'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/objects', $query);
    }
}
