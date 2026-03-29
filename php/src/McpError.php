<?php

declare(strict_types=1);

namespace OntraportMcp;

class McpError extends \Exception
{
    /** @var int */
    public $statusCode;

    /** @var string */
    public $errorType;

    /** @var string|null */
    public $retryAfter;

    public function __construct(int $statusCode, string $errorType, string $message)
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errorType = $errorType;
        $this->retryAfter = null;
    }

    public function toArray(): array
    {
        return [
            'code' => $this->statusCode,
            'error' => $this->errorType,
            'message' => $this->getMessage(),
        ];
    }

    public static function badRequest(string $message = 'Do not retry. Fix malformed input parameters and try again.'): self
    {
        return new self(400, 'bad_request', $message);
    }

    public static function unauthorized(string $message = 'Invalid or missing Api-Key / Api-Appid. Do not retry without new credentials.'): self
    {
        return new self(401, 'unauthorized', $message);
    }

    public static function forbidden(string $message = 'The API key does not have the required scope for this operation. Report the missing scope to the user.'): self
    {
        return new self(403, 'forbidden', $message);
    }

    public static function notFound(string $message = 'The requested object ID does not exist, or the endpoint URL is incorrect. Verify object IDs before retrying.'): self
    {
        return new self(404, 'not_found', $message);
    }

    public static function unprocessable(string $message = 'Field validation failed. Fix the invalid field values and retry.'): self
    {
        return new self(422, 'unprocessable_entity', $message);
    }

    public static function rateLimited(?string $retryAfter = null): self
    {
        $err = new self(429, 'rate_limited', 'Retry after a backoff. Ontraport allows 180 requests/minute/account.');
        $err->retryAfter = $retryAfter;
        return $err;
    }

    public static function serverError(string $message = 'Retry with exponential backoff (max 3 attempts). If persistent, report to the user.'): self
    {
        return new self(500, 'server_error', $message);
    }

    public static function fromHttpStatus(int $status, string $message = ''): self
    {
        switch ($status) {
            case 400: return self::badRequest($message ?: 'Bad request');
            case 401: return self::unauthorized($message ?: 'Unauthorized');
            case 403: return self::forbidden($message ?: 'Forbidden');
            case 404: return self::notFound($message ?: 'Not found');
            case 422: return self::unprocessable($message ?: 'Unprocessable entity');
            case 429: return self::rateLimited();
            case 500: return self::serverError($message ?: 'Server error');
            default: return new self($status, 'unknown_error', $message ?: "Unexpected error (HTTP {$status})");
        }
    }
}
