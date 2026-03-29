<?php

declare(strict_types=1);

namespace OntraportMcp\Manifest;

use OntraportMcp\Ontraport\Client;

class Builder
{
    const MAX_MANIFEST_TOOLS = 100;
    const TOOLS_PER_CUSTOM_OBJECT = 4;

    const BUILTIN_OBJECT_TYPE_IDS = [
        0, 1, 3, 5, 6, 7, 12, 14, 16, 17, 30, 44, 46, 52, 138, 140,
    ];

    /**
     * @return array{tools: array, customObjectMap: array<string, int>}
     */
    public static function buildManifest($client): array
    {
        $metaResponse = $client->get('/objects/meta');
        $objectMeta = isset($metaResponse['data']) ? $metaResponse['data'] : $metaResponse;

        $staticManifest = StaticTools::manifestEntries();

        $customObjects = [];
        $customObjectMap = [];

        foreach ($objectMeta as $typeId => $meta) {
            $id = (int) $typeId;
            if (in_array($id, self::BUILTIN_OBJECT_TYPE_IDS, true)) {
                continue;
            }
            if (empty($meta['name'])) {
                continue;
            }

            $safeName = CustomObjectTools::sanitizeName($meta['name']);
            $customObjectMap[$safeName] = $id;

            $customObjects[] = [
                'name' => $meta['name'],
                'objectTypeId' => $id,
                'lastModified' => (int) (isset($meta['last_modified']) ? $meta['last_modified'] : (isset($meta['dlm']) ? $meta['dlm'] : 0)),
            ];
        }

        usort($customObjects, function ($a, $b) {
            return $b['lastModified'] - $a['lastModified'];
        });

        $staticCount = count($staticManifest);
        $availableSlots = self::MAX_MANIFEST_TOOLS - $staticCount;
        $maxCustomObjects = (int) floor($availableSlots / self::TOOLS_PER_CUSTOM_OBJECT);
        $truncated = false;

        $includedCustomObjects = $customObjects;
        if (count($customObjects) > $maxCustomObjects) {
            $includedCustomObjects = array_slice($customObjects, 0, $maxCustomObjects);
            $truncated = true;
        }

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
