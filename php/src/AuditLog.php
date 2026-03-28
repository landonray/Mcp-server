<?php

declare(strict_types=1);

namespace OntraportMcp;

class AuditLog
{
    private static ?string $logFile = null;

    public static function init(?string $logDir = null): void
    {
        $logDir = $logDir ?: getenv('MCP_LOG_DIR') ?: getcwd() . '/logs';

        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }

        self::$logFile = $logDir . '/audit.jsonl';
    }

    private static function write(array $entry): void
    {
        if (self::$logFile === null) {
            self::init();
        }

        $line = json_encode(array_merge(
            ['timestamp' => date('c')],
            $entry
        )) . "\n";

        @file_put_contents(self::$logFile, $line, FILE_APPEND | LOCK_EX);
    }

    public static function logToolCall(array $data): void
    {
        self::write([
            'event' => 'tool_call',
            'sessionId' => $data['sessionId'] ?? null,
            'credentialHash' => $data['credentialHash'] ?? null,
            'tool' => $data['tool'],
            'args' => self::sanitizeArgs($data['args'] ?? []),
            'durationMs' => $data['durationMs'] ?? null,
            'status' => $data['status'], // 'success' | 'error'
            'error' => $data['error'] ?? null,
        ]);
    }

    public static function logToolsList(array $data): void
    {
        self::write([
            'event' => 'tools_list',
            'sessionId' => $data['sessionId'] ?? null,
            'credentialHash' => $data['credentialHash'] ?? null,
            'toolCount' => $data['toolCount'] ?? 0,
            'durationMs' => $data['durationMs'] ?? null,
            'status' => $data['status'],
            'error' => $data['error'] ?? null,
        ]);
    }

    public static function logSession(array $data): void
    {
        self::write([
            'event' => $data['event'], // 'session_created' | 'session_expired' | 'session_closed' | 'session_auth_failed'
            'sessionId' => $data['sessionId'] ?? null,
            'credentialHash' => $data['credentialHash'] ?? null,
        ]);
    }

    public static function logAuthFailure(array $data): void
    {
        self::write([
            'event' => 'auth_failure',
            'reason' => $data['reason'],
            'ip' => $data['ip'] ?? null,
        ]);
    }

    /**
     * Strip sensitive values from tool arguments before logging.
     */
    public static function sanitizeArgs(mixed $args): mixed
    {
        if (!is_array($args)) {
            return $args;
        }

        $sensitive = [
            'ccnumber', 'code', 'expire_month', 'expire_year',
            'cctoken', 'payer', 'billing_address',
        ];

        $sanitized = [];
        foreach ($args as $key => $value) {
            if (in_array($key, $sensitive, true)) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = array_is_list($value)
                    ? '[Array(' . count($value) . ')]'
                    : '{Object(' . implode(',', array_keys($value)) . ')}';
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }
}
