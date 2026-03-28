<?php

declare(strict_types=1);

namespace OntraportMcp\Tests;

use OntraportMcp\Manifest\StaticTools;
use OntraportMcp\Tools\Registry;
use PHPUnit\Framework\TestCase;

class RegistryTest extends TestCase
{
    public function testAllStaticToolsHaveHandlers(): void
    {
        foreach (StaticTools::all() as $tool) {
            $handler = Registry::getHandler($tool['name']);
            $this->assertNotNull($handler, "Missing handler for {$tool['name']}");
            $this->assertIsCallable($handler);
        }
    }

    public function testCustomObjectToolParsing(): void
    {
        $parsed = Registry::parseCustomToolName('get_MyWidget');
        $this->assertEquals('get', $parsed['operation']);
        $this->assertEquals('MyWidget', $parsed['suffix']);

        $parsed = Registry::parseCustomToolName('create_Some_Object');
        $this->assertEquals('create', $parsed['operation']);
        $this->assertEquals('Some_Object', $parsed['suffix']);
    }

    public function testCustomObjectToolParsingIgnoresStaticTools(): void
    {
        // get_contact is a static tool, not a custom object
        $this->assertNull(Registry::parseCustomToolName('get_contact'));
        $this->assertNull(Registry::parseCustomToolName('get_tasks'));
        $this->assertNull(Registry::parseCustomToolName('get_message'));
    }

    public function testCustomObjectHandlerResolution(): void
    {
        $map = ['Widget' => 10000];
        $handler = Registry::getHandler('get_Widget', $map);
        $this->assertNotNull($handler);
        $this->assertIsCallable($handler);
    }

    public function testCustomObjectHandlerReturnsNullForUnknown(): void
    {
        $handler = Registry::getHandler('get_NonExistent', []);
        $this->assertNull($handler);
    }

    public function testUnknownToolReturnsNull(): void
    {
        $this->assertNull(Registry::getHandler('totally_fake_tool'));
    }
}
