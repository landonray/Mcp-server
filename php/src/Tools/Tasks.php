<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Tasks
{
    public static function assign_task(object $client, array $params): array
    {
        return $client->post('/task/assign', [
            'object_type_id' => $params['object_type_id'],
            'ids' => $params['ids'],
            'message' => $params['message'],
        ]);
    }

    public static function complete_task(object $client, array $params): array
    {
        $body = [
            'object_type_id' => $params['object_type_id'],
            'ids' => $params['ids'],
        ];
        if (isset($params['data'])) {
            $body['data'] = $params['data'];
        }
        return $client->post('/task/complete', $body);
    }

    public static function cancel_task(object $client, array $params): array
    {
        return $client->post('/task/cancel', [
            'objectID' => $params['objectID'],
            'ids' => $params['ids'],
        ]);
    }

    public static function update_task(object $client, array $params): array
    {
        $body = ['id' => $params['id']];
        if (isset($params['owner'])) $body['owner'] = $params['owner'];
        if (isset($params['date_due'])) $body['date_due'] = $params['date_due'];
        if (isset($params['status'])) $body['status'] = $params['status'];
        return $client->put('/Tasks', $body);
    }

    public static function get_tasks(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['sort'])) $query['sort'] = $params['sort'];
        if (isset($params['sortDir'])) $query['sortDir'] = $params['sortDir'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Tasks', $query);
    }

    public static function reschedule_task(object $client, array $params): array
    {
        return $client->post('/task/reschedule', [
            'id' => $params['id'],
            'newtime' => $params['newtime'],
        ]);
    }
}
