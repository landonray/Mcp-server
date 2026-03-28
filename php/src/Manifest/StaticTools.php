<?php

declare(strict_types=1);

namespace OntraportMcp\Manifest;

/**
 * Single source of truth for all static tool definitions.
 * Generated from the same data as the Node.js implementation.
 */
class StaticTools
{
    private static ?array $tools = null;

    public static function all(): array
    {
        if (self::$tools === null) {
            $json = file_get_contents(__DIR__ . '/../../data/static-tools.json');
            self::$tools = json_decode($json, true);
        }
        return self::$tools;
    }

    /**
     * Get tool definitions suitable for manifest (name, description, inputSchema only).
     */
    public static function manifestEntries(): array
    {
        return array_map(fn(array $tool) => [
            'name' => $tool['name'],
            'description' => $tool['description'],
            'inputSchema' => $tool['inputSchema'],
        ], self::all());
    }
}
