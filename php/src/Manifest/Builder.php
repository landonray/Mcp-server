<?php

declare(strict_types=1);

namespace OntraportMcp\Manifest;

use OntraportMcp\Ontraport\Client;

class Builder
{
    public const MAX_MANIFEST_TOOLS = 100;
    public const TOOLS_PER_CUSTOM_OBJECT = 4;

    public const BUILTIN_OBJECT_TYPE_IDS = [
        0,   // Contact
        1,   // Task
        3,   // Group
        5,   // Sequence
        6,   // Rule
        7,   // Message
        12,  // Note
        14,  // Tag
        16,  // Product
        17,  // Purchase
        30,  // Purchase History Log
        44,  // Open Order
        46,  // Transaction
        52,  // Order
        138, // Tag Subscriber
        140, // Campaign/Automation
    ];

    /**
     * Build the tool manifest and custom object lookup map.
     *
     * @return array{tools: array, customObjectMap: array<string, int>}
     */
    public static function buildManifest(Client $client): array
    {
        $metaResponse = $client->get('/objects/meta');
        $objectMeta = $metaResponse['data'] ?? $metaResponse;

        $staticManifest = StaticTools::manifestEntries();

        // Discover custom objects and build name→typeId map
        $customObjects = [];
        $customObjectMap = [];

        foreach ($objectMeta as $typeId => $meta) {
            $id = (int) $typeId;
            if (in_array($id, self::BUILTIN_OBJECT_TYPE_IDS, true)) continue;
            if (empty($meta['name'])) continue;

            $safeName = CustomObjectTools::sanitizeName($meta['name']);
            $customObjectMap[$safeName] = $id;

            $customObjects[] = [
                'name' => $meta['name'],
                'objectTypeId' => $id,
                'lastModified' => (int) ($meta['last_modified'] ?? $meta['dlm'] ?? 0),
            ];
        }

        // Sort by most recently modified (descending)
        usort($customObjects, fn($a, $b) => $b['lastModified'] - $a['lastModified']);

        // Enforce 100-tool cap at whole-object boundaries
        $staticCount = count($staticManifest);
        $availableSlots = self::MAX_MANIFEST_TOOLS - $staticCount;
        $maxCustomObjects = (int) floor($availableSlots / self::TOOLS_PER_CUSTOM_OBJECT);
        $truncated = false;

        $includedCustomObjects = $customObjects;
        if (count($customObjects) > $maxCustomObjects) {
            $includedCustomObjects = array_slice($customObjects, 0, $maxCustomObjects);
            $truncated = true;
        }

        // Generate custom object tools
        $customToolEntries = [];
        foreach ($includedCustomObjects as $obj) {
            $tools = CustomObjectTools::generate($obj['name'], $obj['objectTypeId']);
            foreach ($tools as $tool) {
                $customToolEntries[] = [
                    'name' => $tool['name'],
                    'description' => $tool['description'],
                    'inputSchema' => $tool['inputSchema'],
                ];
            }
        }

        $manifest = array_merge($staticManifest, $customToolEntries);

        if ($truncated) {
            $manifest[] = [
                'name' => '_manifest_note',
                'description' => 'This account has additional custom objects that were omitted to keep the manifest within size limits. You can use get_object_meta to discover all available objects, and request a specific custom object by name.',
                'inputSchema' => ['type' => 'object', 'properties' => new \stdClass()],
            ];
        }

        return [
            'tools' => $manifest,
            'customObjectMap' => $customObjectMap,
        ];
    }
}
