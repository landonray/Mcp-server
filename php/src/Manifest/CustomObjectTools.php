<?php

declare(strict_types=1);

namespace OntraportMcp\Manifest;

class CustomObjectTools
{
    public static function sanitizeName(string $name): string
    {
        $safe = preg_replace('/[^a-zA-Z0-9_ ]/', '', $name);
        $safe = preg_replace('/\s+/', '_', $safe);
        $safe = preg_replace('/_+/', '_', $safe);
        return trim($safe, '_');
    }

    /**
     * Generate 4 tool definitions for a custom object.
     */
    public static function generate(string $name, int $objectTypeId): array
    {
        $safeName = self::sanitizeName($name);

        return [
            [
                'name' => "get_{$safeName}",
                'description' => "Retrieve a single {$name} record by its ID. Returns all fields defined on the object.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'id' => ['type' => 'integer', 'description' => "The {$name} record ID."],
                    ],
                    'required' => ['id'],
                ],
                'objectTypeId' => $objectTypeId,
            ],
            [
                'name' => "create_{$safeName}",
                'description' => "Create a new {$name} record. The owner field is required for custom objects to save properly.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'owner' => ['type' => 'integer', 'description' => 'Owner user ID (required for custom objects).'],
                    ],
                    'required' => ['owner'],
                    'additionalProperties' => true,
                ],
                'objectTypeId' => $objectTypeId,
            ],
            [
                'name' => "update_{$safeName}",
                'description' => "Update fields on an existing {$name} record. Only the fields you include will be changed.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'id' => ['type' => 'integer', 'description' => "The {$name} record ID to update."],
                    ],
                    'required' => ['id'],
                    'additionalProperties' => true,
                ],
                'objectTypeId' => $objectTypeId,
            ],
            [
                'name' => "search_{$safeName}",
                'description' => "Search records in {$name} by field conditions, free-text search, or tag. Results are paginated with a maximum of 50 per request.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'condition' => ['type' => 'string', 'description' => 'JSON-encoded filter criteria array.'],
                        'search' => ['type' => 'string', 'description' => 'Free-text search.'],
                        'listFields' => ['type' => 'string', 'description' => 'Comma-separated field names.'],
                        'start' => ['type' => 'integer', 'description' => 'Zero-based offset. Default 0.'],
                        'range' => ['type' => 'integer', 'description' => 'Number of records to return. Max 50.', 'maximum' => 50],
                        'sort' => ['type' => 'string', 'description' => 'Field name to sort by.'],
                        'sortDir' => ['type' => 'string', 'enum' => ['asc', 'desc'], 'description' => 'Sort direction.'],
                    ],
                ],
                'objectTypeId' => $objectTypeId,
            ],
        ];
    }
}
