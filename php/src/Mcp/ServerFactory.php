<?php

declare(strict_types=1);

namespace OntraportMcp\Mcp;

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
    public static function create(string $apiKey, string $appId): Server
    {
        $client = new Client($apiKey, $appId);

        // Build manifest to get tool definitions and custom object map
        $manifestResult = Builder::buildManifest($client);
        $customObjectMap = $manifestResult['customObjectMap'];

        $builder = Server::make()
            ->withServerInfo('ontraport-mcp-server', '1.0.0');

        // Register all tools from the manifest
        foreach ($manifestResult['tools'] as $tool) {
            $name = $tool['name'];

            // Skip the manifest note pseudo-tool
            if ($name === '_manifest_note') {
                continue;
            }

            $handler = Registry::getHandler($name, $customObjectMap);
            if ($handler === null) {
                continue;
            }

            // Create a closure that wraps the handler with client creation and response cleaning
            $wrappedHandler = function (array $arguments = []) use ($apiKey, $appId, $handler) {
                $callClient = new Client($apiKey, $appId);
                try {
                    $result = $handler($callClient, $arguments);
                    $cleaned = ResponseCleaner::clean($result);
                    return json_encode($cleaned, JSON_PRETTY_PRINT);
                } catch (McpError $e) {
                    return json_encode($e->toArray(), JSON_PRETTY_PRINT);
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
