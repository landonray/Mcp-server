<?php

declare(strict_types=1);

namespace OntraportMcp\Mcp;

use OntraportMcp\AuditLog;
use OntraportMcp\Manifest\Builder;
use OntraportMcp\McpError;
use OntraportMcp\Ontraport\Client;
use OntraportMcp\Ontraport\ResponseCleaner;
use OntraportMcp\Tools\Registry;
use PhpMcp\Server\Server;

class ServerFactory
{
    /**
     * Create a configured MCP Server for a given set of Ontraport credentials.
     */
    public static function create(string $apiKey, string $appId, ?string $credentialHash = null): Server
    {
        $client = new Client($apiKey, $appId);

        // Build manifest to get tool definitions and custom object map
        $listStart = hrtime(true);
        try {
            $manifestResult = Builder::buildManifest($client);
            $customObjectMap = $manifestResult['customObjectMap'];

            AuditLog::logToolsList([
                'credentialHash' => $credentialHash,
                'toolCount' => count($manifestResult['tools']),
                'durationMs' => (int) ((hrtime(true) - $listStart) / 1_000_000),
                'status' => 'success',
            ]);
        } catch (\Throwable $e) {
            AuditLog::logToolsList([
                'credentialHash' => $credentialHash,
                'toolCount' => 0,
                'durationMs' => (int) ((hrtime(true) - $listStart) / 1_000_000),
                'status' => 'error',
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        $builder = Server::make()
            ->withServerInfo('ontraport-mcp-server', '1.0.0');

        foreach ($manifestResult['tools'] as $tool) {
            $name = $tool['name'];

            if ($name === '_manifest_note') {
                continue;
            }

            $handler = Registry::getHandler($name, $customObjectMap);
            if ($handler === null) {
                continue;
            }

            $wrappedHandler = function (array $arguments = []) use ($apiKey, $appId, $handler, $name, $credentialHash) {
                $callClient = new Client($apiKey, $appId);
                $start = hrtime(true);

                try {
                    $result = $handler($callClient, $arguments);
                    $cleaned = ResponseCleaner::clean($result);

                    AuditLog::logToolCall([
                        'credentialHash' => $credentialHash,
                        'tool' => $name,
                        'args' => $arguments,
                        'durationMs' => (int) ((hrtime(true) - $start) / 1_000_000),
                        'status' => 'success',
                    ]);

                    return json_encode($cleaned, JSON_PRETTY_PRINT);
                } catch (McpError $e) {
                    AuditLog::logToolCall([
                        'credentialHash' => $credentialHash,
                        'tool' => $name,
                        'args' => $arguments,
                        'durationMs' => (int) ((hrtime(true) - $start) / 1_000_000),
                        'status' => 'error',
                        'error' => $e->toArray(),
                    ]);

                    return json_encode($e->toArray(), JSON_PRETTY_PRINT);
                } catch (\Throwable $e) {
                    AuditLog::logToolCall([
                        'credentialHash' => $credentialHash,
                        'tool' => $name,
                        'args' => $arguments,
                        'durationMs' => (int) ((hrtime(true) - $start) / 1_000_000),
                        'status' => 'error',
                        'error' => $e->getMessage(),
                    ]);

                    throw $e;
                }
            };

            $builder = $builder->withTool(
                handler: $wrappedHandler,
                name: $name,
                description: $tool['description'],
                inputSchema: $tool['inputSchema'],
            );
        }

        return $builder->build();
    }
}
