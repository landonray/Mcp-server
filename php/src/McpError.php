<?php

declare(strict_types=1);

namespace OntraportMcp;

class McpError extends \Exception
{
    public int $statusCode;
    public string $errorType;

    public function __construct(int $statusCode, string $errorType, string $message)
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->errorType = $errorType;
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

    public static function forbidden(string $message = 'The API key does not have the required scope for this operation.'): self
    {
        return new self(403, 'forbidden', $message);
    }

    public static function notFound(string $message = 'The requested object ID does not exist. Verify object IDs before retrying.'): self
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
        return $err;
    }

    public static function serverError(string $message = 'Retry with exponential backoff (max 3 attempts).'): self
    {
        return new self(500, 'server_error', $message);
    }

    public static function fromHttpStatus(int $status, string $message = ''): self
    {
        return match ($status) {
            400 => self::badRequest($message ?: 'Bad request'),
            401 => self::unauthorized($message ?: 'Unauthorized'),
            403 => self::forbidden($message ?: 'Forbidden'),
            404 => self::notFound($message ?: 'Not found'),
            422 => self::unprocessable($message ?: 'Unprocessable entity'),
            429 => self::rateLimited(),
            500 => self::serverError($message ?: 'Server error'),
            default => new self($status, 'unknown_error', $message ?: "Unexpected error (HTTP {$status})"),
        };
    }
}
