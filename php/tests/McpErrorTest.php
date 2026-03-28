<?php

declare(strict_types=1);

namespace OntraportMcp\Tests;

use OntraportMcp\McpError;
use PHPUnit\Framework\TestCase;

class McpErrorTest extends TestCase
{
    public function testBadRequest(): void
    {
        $err = McpError::badRequest('Missing field');
        $this->assertEquals(400, $err->statusCode);
        $this->assertEquals('bad_request', $err->errorType);
        $this->assertEquals('Missing field', $err->getMessage());
    }

    public function testToArray(): void
    {
        $err = McpError::unauthorized();
        $arr = $err->toArray();
        $this->assertEquals(401, $arr['code']);
        $this->assertEquals('unauthorized', $arr['error']);
        $this->assertIsString($arr['message']);
    }

    public function testAllErrorTypes(): void
    {
        $this->assertEquals(400, McpError::badRequest()->statusCode);
        $this->assertEquals(401, McpError::unauthorized()->statusCode);
        $this->assertEquals(403, McpError::forbidden()->statusCode);
        $this->assertEquals(404, McpError::notFound()->statusCode);
        $this->assertEquals(422, McpError::unprocessable()->statusCode);
        $this->assertEquals(429, McpError::rateLimited()->statusCode);
        $this->assertEquals(500, McpError::serverError()->statusCode);
    }

    public function testFromHttpStatus(): void
    {
        $this->assertEquals(400, McpError::fromHttpStatus(400)->statusCode);
        $this->assertEquals(401, McpError::fromHttpStatus(401)->statusCode);
        $this->assertEquals(403, McpError::fromHttpStatus(403)->statusCode);
        $this->assertEquals(404, McpError::fromHttpStatus(404)->statusCode);
        $this->assertEquals(422, McpError::fromHttpStatus(422)->statusCode);
        $this->assertEquals(429, McpError::fromHttpStatus(429)->statusCode);
        $this->assertEquals(500, McpError::fromHttpStatus(500)->statusCode);
        $this->assertEquals(503, McpError::fromHttpStatus(503)->statusCode);
    }
}
