<?php

declare(strict_types=1);

namespace OntraportMcp\Tools;

use OntraportMcp\Ontraport\Client;

class Sequences
{
    public static function subscribe_to_sequence(object $client, array $params): array
    {
        return $client->put('/objects/subscribe', [
            'objectID' => 0,
            'ids' => $params['ids'],
            'add_list' => $params['add_list'],
            'sub_type' => $params['sub_type'] ?? 'Campaign',
        ]);
    }

    public static function unsubscribe_from_sequence(object $client, array $params): array
    {
        return $client->delete('/objects/subscribe', [], [
            'objectID' => 0,
            'ids' => $params['ids'],
            'remove_list' => $params['remove_list'],
            'sub_type' => $params['sub_type'] ?? 'Campaign',
        ]);
    }

    public static function pause_rules_and_sequences(object $client, array $params): array
    {
        return $client->post('/objects/pause', [
            'objectID' => $params['objectID'],
            'ids' => $params['ids'],
        ]);
    }

    public static function unpause_rules_and_sequences(object $client, array $params): array
    {
        return $client->post('/objects/unpause', [
            'objectID' => $params['objectID'],
            'ids' => $params['ids'],
        ]);
    }
}
