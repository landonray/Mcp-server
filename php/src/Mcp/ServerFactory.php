<?php

declare(strict_types=1);

namespace OntraportMcp\Mcp;

use OntraportMcp\AuditLog;
use OntraportMcp\Manifest\Builder;
use OntraportMcp\McpError;
use OntraportMcp\Ontraport\Client;
use OntraportMcp\Ontraport\ResponseCleaner;
use OntraportMcp\Tools\Registry;

class ServerFactory
{
    /**
     * Create a handler callable that processes MCP JSON-RPC methods.
     *
     * @param string $apiKey
     * @param string $appId
     * @param string|null $credentialHash
     * @return callable function(string $method, array $params): ?array
     */
    public static function createHandler(string $apiKey, string $appId, ?string $credentialHash = null): callable
    {
        $customObjectMap = [];
        $manifestBuilt = false;

        return function (string $method, array $params) use ($apiKey, $appId, $credentialHash, &$customObjectMap, &$manifestBuilt) {
            switch ($method) {
                case 'initialize':
                    return [
                        'protocolVersion' => '2024-11-05',
                        'serverInfo' => ['name' => 'ontraport-mcp-server', 'version' => '1.0.0'],
                        'capabilities' => ['tools' => new \stdClass()],
                    ];

                case 'notifications/initialized':
                    return null;

                case 'tools/list':
                    return self::handleToolsList($apiKey, $appId, $credentialHash, $customObjectMap, $manifestBuilt);

                case 'tools/call':
                    return self::handleToolCall($apiKey, $appId, $params, $credentialHash, $customObjectMap);

                default:
                    throw new \RuntimeException("Method not found: {$method}");
            }
        };
    }

    private static function handleToolsList(string $apiKey, string $appId, ?string $credentialHash, array &$customObjectMap, bool &$manifestBuilt): array
    {
        $start = microtime(true);
        try {
            $client = new Client($apiKey, $appId);
            $result = Builder::buildManifest($client);
            $customObjectMap = $result['customObjectMap'];
            $manifestBuilt = true;

            AuditLog::logToolsList([
                'credentialHash' => $credentialHash,
                'toolCount' => count($result['tools']),
                'durationMs' => (int) ((microtime(true) - $start) * 1000),
                'status' => 'success',
            ]);

            return ['tools' => $result['tools']];
        } catch (\Throwable $e) {
            AuditLog::logToolsList([
                'credentialHash' => $credentialHash,
                'toolCount' => 0,
                'durationMs' => (int) ((microtime(true) - $start) * 1000),
                'status' => 'error',
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private static function handleToolCall(string $apiKey, string $appId, array $params, ?string $credentialHash, array $customObjectMap): array
    {
        $name = isset($params['name']) ? $params['name'] : '';
        $args = isset($params['arguments']) ? $params['arguments'] : [];

        $start = microtime(true);
        $client = new Client($apiKey, $appId);
        $handler = Registry::getHandler($name, $customObjectMap);

        if ($handler === null) {
            AuditLog::logToolCall([
                'credentialHash' => $credentialHash,
                'tool' => $name,
                'args' => $args,
                'durationMs' => (int) ((microtime(true) - $start) * 1000),
                'status' => 'error',
                'error' => "Unknown tool: {$name}",
            ]);

            return [
                'content' => [['type' => 'text', 'text' => json_encode(['code' => 400, 'error' => 'bad_request', 'message' => "Unknown tool: {$name}"])]],
                'isError' => true,
            ];
        }

        try {
            $result = $handler($client, $args);
            $cleaned = ResponseCleaner::clean($result);

            AuditLog::logToolCall([
                'credentialHash' => $credentialHash,
                'tool' => $name,
                'args' => $args,
                'durationMs' => (int) ((microtime(true) - $start) * 1000),
                'status' => 'success',
            ]);

            return [
                'content' => [['type' => 'text', 'text' => json_encode($cleaned, JSON_PRETTY_PRINT)]],
            ];
        } catch (McpError $e) {
            AuditLog::logToolCall([
                'credentialHash' => $credentialHash,
                'tool' => $name,
                'args' => $args,
                'durationMs' => (int) ((microtime(true) - $start) * 1000),
                'status' => 'error',
                'error' => $e->toArray(),
            ]);

            return [
                'content' => [['type' => 'text', 'text' => json_encode($e->toArray(), JSON_PRETTY_PRINT)]],
                'isError' => true,
            ];
        } catch (\Throwable $e) {
            AuditLog::logToolCall([
                'credentialHash' => $credentialHash,
                'tool' => $name,
                'args' => $args,
                'durationMs' => (int) ((microtime(true) - $start) * 1000),
                'status' => 'error',
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
