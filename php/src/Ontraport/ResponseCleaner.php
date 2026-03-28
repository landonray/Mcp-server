<?php

declare(strict_types=1);

namespace OntraportMcp\Ontraport;

class ResponseCleaner
{
    private const STRIPPED_FIELDS = [
        'system_source',
        'source_location',
        'import_id',
        'bindex',
        'ip_addy',
        'ip_addy_display',
        'contact_cat',
        'updateSequence',
        'updateCampaign',
        'account_id',
    ];

    public static function clean(mixed $data): mixed
    {
        if ($data === null) {
            return null;
        }

        if (is_array($data)) {
            // Check if it's an associative array (object-like)
            if (array_is_list($data)) {
                return array_map([self::class, 'clean'], $data);
            }

            $cleaned = [];
            foreach ($data as $key => $value) {
                if (in_array($key, self::STRIPPED_FIELDS, true)) {
                    continue;
                }
                $cleaned[$key] = self::clean($value);
            }
            return $cleaned;
        }

        return $data;
    }
}
