#!/usr/bin/env php
<?php
/**
 * Ontraport MCP Server — PHP Implementation
 *
 * Usage (stdio transport, credentials via environment):
 *   API_KEY=your-key API_APPID=your-appid php server.php
 *
 * Usage (HTTP transport):
 *   API_KEY=your-key API_APPID=your-appid php server.php --http --port=3000
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use OntraportMcp\AuditLog;
use OntraportMcp\Mcp\ServerFactory;
use PhpMcp\Server\Transports\StdioServerTransport;
use PhpMcp\Server\Transports\StreamableHttpServerTransport;

// Initialize audit logging
AuditLog::init();

// Read credentials from environment
$apiKey = getenv('API_KEY') ?: getenv('Api_Key') ?: '';
$appId = getenv('API_APPID') ?: getenv('Api_Appid') ?: '';

if (empty($apiKey) || empty($appId)) {
    fwrite(STDERR, "Error: API_KEY and API_APPID environment variables are required.\n");
    fwrite(STDERR, "Usage: API_KEY=your-key API_APPID=your-appid php server.php\n");
    exit(1);
}

// Parse CLI arguments
$useHttp = in_array('--http', $argv);
$port = 3000;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--port=')) {
        $port = (int) substr($arg, 7);
    }
}

// Credential hash for audit logging (never log the actual credentials)
$credentialHash = hash('sha256', "{$apiKey}:{$appId}");

AuditLog::logSession([
    'event' => 'session_created',
    'credentialHash' => $credentialHash,
]);

// Create the MCP server with all tools registered
fwrite(STDERR, "Building tool manifest...\n");
$server = ServerFactory::create($apiKey, $appId, $credentialHash);

// Start listening
if ($useHttp) {
    fwrite(STDERR, "Starting HTTP transport on port {$port}...\n");
    $transport = new StreamableHttpServerTransport(host: '0.0.0.0', port: $port);
} else {
    fwrite(STDERR, "Starting stdio transport...\n");
    $transport = new StdioServerTransport();
}

$server->listen($transport);
