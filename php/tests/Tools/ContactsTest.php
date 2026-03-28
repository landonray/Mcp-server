<?php

declare(strict_types=1);

namespace OntraportMcp\Tests\Tools;

use OntraportMcp\McpError;
use OntraportMcp\Tools\Contacts;
use PHPUnit\Framework\TestCase;

class ContactsTest extends TestCase
{
    private function mockClient(): object
    {
        return new class {
            public array $calls = [];

            public function get(string $path, array $params = []): array
            {
                $this->calls[] = ['get', $path, $params];
                return ['data' => ['id' => '27']];
            }

            public function post(string $path, array $body = []): array
            {
                $this->calls[] = ['post', $path, $body];
                return ['data' => ['id' => '42']];
            }

            public function put(string $path, array $body = []): array
            {
                $this->calls[] = ['put', $path, $body];
                return ['data' => ['id' => '27']];
            }

            public function delete(string $path, array $params = [], array $body = []): array
            {
                $this->calls[] = ['delete', $path, $params];
                return ['data' => []];
            }
        };
    }

    public function testGetContactById(): void
    {
        $client = $this->mockClient();
        Contacts::get_contact($client, ['id' => 27]);
        $this->assertEquals(['get', '/Contact', ['id' => 27]], $client->calls[0]);
    }

    public function testGetContactByEmail(): void
    {
        $client = $this->mockClient();
        Contacts::get_contact($client, ['email' => 'test@test.com']);
        $this->assertEquals(['get', '/object/getByEmail', ['objectID' => 0, 'email' => 'test@test.com']], $client->calls[0]);
    }

    public function testGetContactByEmailWithAll(): void
    {
        $client = $this->mockClient();
        Contacts::get_contact($client, ['email' => 'test@test.com', 'all' => 1]);
        $this->assertEquals(['get', '/object/getByEmail', ['objectID' => 0, 'email' => 'test@test.com', 'all' => 1]], $client->calls[0]);
    }

    public function testGetContactThrowsWithoutIdOrEmail(): void
    {
        $this->expectException(McpError::class);
        Contacts::get_contact($this->mockClient(), []);
    }

    public function testSearchContacts(): void
    {
        $client = $this->mockClient();
        Contacts::search_contacts($client, ['search' => 'Smith', 'range' => 10]);
        $this->assertEquals('get', $client->calls[0][0]);
        $this->assertEquals('/Contacts', $client->calls[0][1]);
        $this->assertEquals(10, $client->calls[0][2]['range']);
        $this->assertEquals('Smith', $client->calls[0][2]['search']);
    }

    public function testSearchContactsDefaultRange(): void
    {
        $client = $this->mockClient();
        Contacts::search_contacts($client, []);
        $this->assertEquals(50, $client->calls[0][2]['range']);
    }

    public function testCreateContact(): void
    {
        $client = $this->mockClient();
        Contacts::create_contact($client, ['email' => 'a@b.com', 'firstname' => 'A']);
        $this->assertEquals(['post', '/Contacts', ['email' => 'a@b.com', 'firstname' => 'A']], $client->calls[0]);
    }

    public function testMergeOrCreateContact(): void
    {
        $client = $this->mockClient();
        Contacts::merge_or_create_contact($client, ['email' => 'a@b.com', 'firstname' => 'A']);
        $this->assertEquals(['post', '/Contacts/saveorupdate', ['email' => 'a@b.com', 'firstname' => 'A']], $client->calls[0]);
    }

    public function testMergeOrCreateContactThrowsWithoutEmail(): void
    {
        $this->expectException(McpError::class);
        Contacts::merge_or_create_contact($this->mockClient(), []);
    }

    public function testUpdateContact(): void
    {
        $client = $this->mockClient();
        Contacts::update_contact($client, ['id' => 27, 'firstname' => 'Updated']);
        $this->assertEquals(['put', '/Contacts', ['id' => 27, 'firstname' => 'Updated']], $client->calls[0]);
    }

    public function testUpdateContactThrowsWithoutId(): void
    {
        $this->expectException(McpError::class);
        Contacts::update_contact($this->mockClient(), []);
    }

    public function testDeleteContact(): void
    {
        $client = $this->mockClient();
        Contacts::delete_contact($client, ['id' => 27]);
        $this->assertEquals(['delete', '/Contact', ['id' => 27]], $client->calls[0]);
    }

    public function testGetContactCount(): void
    {
        $client = $this->mockClient();
        Contacts::get_contact_count($client, ['condition' => '[]']);
        $this->assertEquals(['get', '/Contacts/getInfo', ['condition' => '[]']], $client->calls[0]);
    }
}
