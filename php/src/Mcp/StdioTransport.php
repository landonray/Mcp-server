<?php

declare(strict_types=1);

namespace OntraportMcp\Mcp;

/**
 * Minimal MCP stdio transport — reads JSON-RPC from stdin, writes to stdout.
 * Compatible with PHP 7.4+.
 */
class StdioTransport
{
    /** @var callable */
    private $handler;

    public function __construct(callable $handler)
    {
        $this->handler = $handler;
    }

    public function listen(): void
    {
        $stdin = fopen('php://stdin', 'r');

        while (($line = fgets($stdin)) !== false) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $request = json_decode($line, true);
            if ($request === null) {
                $this->respond([
                    'jsonrpc' => '2.0',
                    'id' => null,
                    'error' => ['code' => -32700, 'message' => 'Parse error'],
                ]);
                continue;
            }

            // Handle batch requests
            if (isset($request[0])) {
                $responses = [];
                foreach ($request as $req) {
                    $resp = $this->dispatch($req);
                    if ($resp !== null) {
                        $responses[] = $resp;
                    }
                }
                if (!empty($responses)) {
                    $this->respond($responses);
                }
                continue;
            }

            $response = $this->dispatch($request);
            if ($response !== null) {
                $this->respond($response);
            }
        }

        fclose($stdin);
    }

    private function dispatch(array $request): ?array
    {
        $id = isset($request['id']) ? $request['id'] : null;
        $method = isset($request['method']) ? $request['method'] : '';
        $params = isset($request['params']) ? $request['params'] : [];

        // Notifications (no id) don't get responses
        $isNotification = !array_key_exists('id', $request);

        try {
            $result = call_user_func($this->handler, $method, $params);

            if ($isNotification) {
                return null;
            }

            if ($result === null) {
                return null;
            }

            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => $result,
            ];
        } catch (\Throwable $e) {
            if ($isNotification) {
                return null;
            }

            return [
                'jsonrpc' => '2.0',
                'id' => $id,
                'error' => [
                    'code' => -32603,
                    'message' => $e->getMessage(),
                ],
            ];
        }
    }

    /**
     * @param array $data
     */
    private function respond(array $data): void
    {
        fwrite(STDOUT, json_encode($data) . "\n");
        fflush(STDOUT);
    }
}
