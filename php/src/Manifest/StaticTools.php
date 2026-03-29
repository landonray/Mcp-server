<?php

declare(strict_types=1);

namespace OntraportMcp\Manifest;

class StaticTools
{
    /** @var array|null */
    private static $tools = null;

    public static function all(): array
    {
        if (self::$tools === null) {
            $json = file_get_contents(__DIR__ . '/../../data/static-tools.json');
            self::$tools = json_decode($json, true);
        }
        return self::$tools;
    }

    public static function manifestEntries(): array
    {
        return array_map(function (array $tool) {
            return [
                'name' => $tool['name'],
                'description' => $tool['description'],
                'inputSchema' => $tool['inputSchema'],
            ];
        }, self::all());
    }
}
