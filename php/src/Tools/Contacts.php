<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\McpError;
use OntraportMcp\Ontraport\Client;

class Contacts
{
    public static function get_contact(object $client, array $params): array
    {
        if (!empty($params['email'])) {
            $query = ['objectID' => 0, 'email' => $params['email']];
            if (isset($params['all'])) {
                $query['all'] = $params['all'];
            }
            return $client->get('/object/getByEmail', $query);
        }
        if (isset($params['id'])) {
            return $client->get('/Contact', ['id' => $params['id']]);
        }
        throw McpError::badRequest('Either id or email is required for get_contact.');
    }

    public static function search_contacts(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['search'])) $query['search'] = $params['search'];
        if (isset($params['searchNotes'])) $query['searchNotes'] = $params['searchNotes'];
        if (isset($params['listFields'])) $query['listFields'] = $params['listFields'];
        if (isset($params['externs'])) $query['externs'] = $params['externs'];
        if (isset($params['sort'])) $query['sort'] = $params['sort'];
        if (isset($params['sortDir'])) $query['sortDir'] = $params['sortDir'];
        if (isset($params['start'])) $query['start'] = $params['start'];
        $query['range'] = $params['range'] ?? 50;
        return $client->get('/Contacts', $query);
    }

    public static function create_contact(object $client, array $params): array
    {
        return $client->post('/Contacts', $params);
    }

    public static function merge_or_create_contact(object $client, array $params): array
    {
        if (empty($params['email'])) {
            throw McpError::badRequest('email is required for merge_or_create_contact.');
        }
        return $client->post('/Contacts/saveorupdate', $params);
    }

    public static function update_contact(object $client, array $params): array
    {
        if (!isset($params['id'])) {
            throw McpError::badRequest('id is required for update_contact.');
        }
        return $client->put('/Contacts', $params);
    }

    public static function delete_contact(object $client, array $params): array
    {
        if (!isset($params['id'])) {
            throw McpError::badRequest('id is required for delete_contact.');
        }
        return $client->delete('/Contact', ['id' => $params['id']]);
    }

    public static function get_contact_count(object $client, array $params): array
    {
        $query = [];
        if (isset($params['condition'])) $query['condition'] = $params['condition'];
        if (isset($params['search'])) $query['search'] = $params['search'];
        return $client->get('/Contacts/getInfo', $query);
    }
}
