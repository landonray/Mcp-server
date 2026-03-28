<?php

declare(strict_types=1);

namespace OntraportMcp\Tests;

use OntraportMcp\Ontraport\ResponseCleaner;
use PHPUnit\Framework\TestCase;

class ResponseCleanerTest extends TestCase
{
    public function testStripsNoiseFields(): void
    {
        $input = [
            'id' => '27',
            'firstname' => 'Mary',
            'system_source' => 'api',
            'source_location' => 'import',
            'import_id' => '123',
            'bindex' => '5',
            'ip_addy' => '1.2.3.4',
            'ip_addy_display' => '1.2.3.4',
            'contact_cat' => 'old',
            'updateSequence' => '1',
            'updateCampaign' => '1',
            'account_id' => '12345',
        ];

        $result = ResponseCleaner::clean($input);
        $this->assertEquals('27', $result['id']);
        $this->assertEquals('Mary', $result['firstname']);
        $this->assertArrayNotHasKey('system_source', $result);
        $this->assertArrayNotHasKey('import_id', $result);
        $this->assertArrayNotHasKey('account_id', $result);
        $this->assertArrayNotHasKey('bindex', $result);
    }

    public function testRecursiveCleaning(): void
    {
        $input = [
            'data' => [
                'id' => '1',
                'system_source' => 'api',
                'nested' => [
                    'import_id' => '5',
                    'name' => 'test',
                ],
            ],
        ];

        $result = ResponseCleaner::clean($input);
        $this->assertEquals('1', $result['data']['id']);
        $this->assertArrayNotHasKey('system_source', $result['data']);
        $this->assertArrayNotHasKey('import_id', $result['data']['nested']);
        $this->assertEquals('test', $result['data']['nested']['name']);
    }

    public function testCleansArrays(): void
    {
        $input = [
            'data' => [
                ['id' => '1', 'bindex' => '0', 'firstname' => 'A'],
                ['id' => '2', 'bindex' => '1', 'firstname' => 'B'],
            ],
        ];

        $result = ResponseCleaner::clean($input);
        $this->assertCount(2, $result['data']);
        $this->assertArrayNotHasKey('bindex', $result['data'][0]);
        $this->assertEquals('A', $result['data'][0]['firstname']);
    }

    public function testHandlesNull(): void
    {
        $this->assertNull(ResponseCleaner::clean(null));
    }

    public function testPreservesCleanData(): void
    {
        $input = ['id' => '1', 'email' => 'test@test.com', 'lastname' => 'Smith'];
        $result = ResponseCleaner::clean($input);
        $this->assertEquals($input, $result);
    }
}
