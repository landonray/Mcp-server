<?php

declare(strict_types=1);

namespace OntraportMcp\Ontraport;

use OntraportMcp\McpError;

class Client
{
    private const BASE_URL = 'https://api.ontraport.com/1';

    /** @var string */
    private $apiKey;

    /** @var string */
    private $appId;

    public function __construct(string $apiKey, string $appId)
    {
        $this->apiKey = $apiKey;
        $this->appId = $appId;
    }

    public function get(string $path, array $params = []): array
    {
        return $this->request('GET', $path, $params);
    }

    public function post(string $path, array $body = []): array
    {
        return $this->request('POST', $path, [], $body);
    }

    public function put(string $path, array $body = []): array
    {
        return $this->request('PUT', $path, [], $body);
    }

    public function delete(string $path, array $params = [], array $body = []): array
    {
        return $this->request('DELETE', $path, $params, $body);
    }

    private function request(string $method, string $path, array $params = [], array $body = []): array
    {
        $url = self::BASE_URL . $path;

        if (!empty($params)) {
            $filtered = array_filter($params, function ($v) {
                return $v !== null;
            });
            $qs = http_build_query($filtered);
            if ($qs) {
                $url .= '?' . $qs;
            }
        }

        $headers = [
            'Api-Key: ' . $this->apiKey,
            'Api-Appid: ' . $this->appId,
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (!empty($body)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        } elseif ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if (!empty($body)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        }

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw McpError::serverError("Ontraport API request failed: {$curlError}");
        }

        if ($httpCode === 429) {
            throw McpError::rateLimited();
        }

        $data = json_decode($response, true);
        if ($data === null) {
            $data = [];
        }

        if ($httpCode >= 400) {
            $message = $data['message'] ?? $data['error'] ?? "Ontraport API error (HTTP {$httpCode})";
            throw McpError::fromHttpStatus($httpCode, $message);
        }

        return $data;
    }
}
