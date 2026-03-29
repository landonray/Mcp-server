<?php

declare(strict_types=1);

namespace OntraportMcp;

/**
 * Polyfills for PHP 8.x functions used throughout the codebase.
 * Safe to include on PHP 8+ — only defines functions if they don't exist.
 */
class Compat
{
    public static function init(): void
    {
        // no-op, just triggers autoload so the file-level function defs run
    }
}

if (!function_exists('str_starts_with')) {
    function str_starts_with(string $haystack, string $needle): bool
    {
        return strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}

if (!function_exists('array_is_list')) {
    function array_is_list(array $array): bool
    {
        if ($array === []) {
            return true;
        }
        return array_keys($array) === range(0, count($array) - 1);
    }
}
