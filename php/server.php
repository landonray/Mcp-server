#!/usr/bin/env php
<?php
/**
 * Ontraport MCP Server — PHP Implementation (PHP 7.4+)
 *
 * Usage:
 *   API_KEY=your-key API_APPID=your-appid php server.php
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

// Load polyfills for PHP 7.4 compatibility
OntraportMcp\Compat::init();

use OntraportMcp\AuditLog;
use OntraportMcp\Mcp\ServerFactory;
use OntraportMcp\Mcp\StdioTransport;

AuditLog::init();

$apiKey = getenv('API_KEY') ?: (getenv('Api_Key') ?: '');
$appId = getenv('API_APPID') ?: (getenv('Api_Appid') ?: '');

if (empty($apiKey) || empty($appId)) {
    fwrite(STDERR, "Error: API_KEY and API_APPID environment variables are required.\n");
    fwrite(STDERR, "Usage: API_KEY=your-key API_APPID=your-appid php server.php\n");
    exit(1);
}

$credentialHash = hash('sha256', "{$apiKey}:{$appId}");

AuditLog::logSession([
    'event' => 'session_created',
    'credentialHash' => $credentialHash,
]);

fwrite(STDERR, "Starting Ontraport MCP Server (stdio)...\n");

$handler = ServerFactory::createHandler($apiKey, $appId, $credentialHash);
$transport = new StdioTransport($handler);
$transport->listen();
