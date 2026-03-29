<?php

declare(strict_types=1);

namespace OntraportMcp;

class AuditLog
{
    /** @var string|null */
    private static $logFile = null;

    public static function init(?string $logDir = null): void
    {
        if ($logDir === null) {
            $envDir = getenv('MCP_LOG_DIR');
            $logDir = $envDir ? $envDir : getcwd() . '/logs';
        }

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
            'sessionId' => isset($data['sessionId']) ? $data['sessionId'] : null,
            'credentialHash' => isset($data['credentialHash']) ? $data['credentialHash'] : null,
            'tool' => $data['tool'],
            'args' => self::sanitizeArgs(isset($data['args']) ? $data['args'] : []),
            'durationMs' => isset($data['durationMs']) ? $data['durationMs'] : null,
            'status' => $data['status'],
            'error' => isset($data['error']) ? $data['error'] : null,
        ]);
    }

    public static function logToolsList(array $data): void
    {
        self::write([
            'event' => 'tools_list',
            'sessionId' => isset($data['sessionId']) ? $data['sessionId'] : null,
            'credentialHash' => isset($data['credentialHash']) ? $data['credentialHash'] : null,
            'toolCount' => isset($data['toolCount']) ? $data['toolCount'] : 0,
            'durationMs' => isset($data['durationMs']) ? $data['durationMs'] : null,
            'status' => $data['status'],
            'error' => isset($data['error']) ? $data['error'] : null,
        ]);
    }

    public static function logSession(array $data): void
    {
        self::write([
            'event' => $data['event'],
            'sessionId' => isset($data['sessionId']) ? $data['sessionId'] : null,
            'credentialHash' => isset($data['credentialHash']) ? $data['credentialHash'] : null,
        ]);
    }

    public static function logAuthFailure(array $data): void
    {
        self::write([
            'event' => 'auth_failure',
            'reason' => $data['reason'],
            'ip' => isset($data['ip']) ? $data['ip'] : null,
        ]);
    }

    /**
     * @param mixed $args
     * @return mixed
     */
    public static function sanitizeArgs($args)
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
