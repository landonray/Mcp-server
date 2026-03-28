<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Tags
{
    public static function add_tag_by_name(object $client, array $params): array
    {
        return $client->put('/objects/tagByName', [
            'objectID' => 0,
            'ids' => $params['ids'],
            'add_names' => $params['add_names'],
        ]);
    }

    public static function remove_tag_by_name(object $client, array $params): array
    {
        return $client->delete('/objects/tagByName', [], [
            'objectID' => 0,
            'ids' => $params['ids'],
            'remove_names' => $params['remove_names'],
        ]);
    }

    public static function add_tag_by_id(object $client, array $params): array
    {
        return $client->put('/objects/tag', [
            'objectID' => 0,
            'ids' => $params['ids'],
            'add_list' => $params['add_list'],
        ]);
    }

    public static function remove_tag_by_id(object $client, array $params): array
    {
        return $client->delete('/objects/tag', [], [
            'objectID' => 0,
            'ids' => $params['ids'],
            'remove_list' => $params['remove_list'],
        ]);
    }

    public static function get_contacts_by_tag(object $client, array $params): array
    {
        $query = ['objectID' => 0];
        if (isset($params['tag_name'])) $query['tag_name'] = $params['tag_name'];
        if (isset($params['tag_id'])) $query['tag_id'] = $params['tag_id'];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/objects/tag', $query);
    }

    public static function list_tags(object $client, array $params): array
    {
        $query = [];
        if (isset($params['sort'])) $query['sort'] = $params['sort'];
        if (isset($params['sortDir'])) $query['sortDir'] = $params['sortDir'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        if (isset($params['range'])) $query['range'] = $params['range'];
        return $client->get('/Tags', $query);
    }
}
