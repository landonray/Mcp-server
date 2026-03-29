<?php

declare(strict_types=1);

namespace OntraportMcp\Tests;

use OntraportMcp\Manifest\Builder;
use OntraportMcp\Manifest\CustomObjectTools;
use OntraportMcp\Manifest\StaticTools;
use PHPUnit\Framework\TestCase;

class ManifestTest extends TestCase
{
    public function testStaticToolCount(): void
    {
        $tools = StaticTools::all();
        $this->assertCount(51, $tools);
    }

    public function testStaticToolsHaveRequiredFields(): void
    {
        foreach (StaticTools::all() as $tool) {
            $this->assertArrayHasKey('name', $tool);
            $this->assertArrayHasKey('description', $tool);
            $this->assertArrayHasKey('inputSchema', $tool);
            $this->assertEquals('object', $tool['inputSchema']['type']);
        }
    }

    public function testManifestEntriesStripInternalFields(): void
    {
        $entries = StaticTools::manifestEntries();
        foreach ($entries as $entry) {
            $this->assertArrayHasKey('name', $entry);
            $this->assertArrayHasKey('description', $entry);
            $this->assertArrayHasKey('inputSchema', $entry);
            $this->assertArrayNotHasKey('module', $entry);
            $this->assertArrayNotHasKey('objectTypeId', $entry);
        }
    }

    public function testCustomObjectToolGeneration(): void
    {
        $tools = CustomObjectTools::generate('My Widget', 10000);
        $this->assertCount(4, $tools);

        $names = array_map(function ($t) { return $t['name']; }, $tools);
        sort($names);
        $this->assertEquals([
            'create_My_Widget',
            'get_My_Widget',
            'search_My_Widget',
            'update_My_Widget',
        ], $names);
    }

    public function testSanitizeName(): void
    {
        $this->assertEquals('My_Widget', CustomObjectTools::sanitizeName('My Widget'));
        $this->assertEquals('Test123', CustomObjectTools::sanitizeName('Test@#$123'));
        $this->assertEquals('Simple', CustomObjectTools::sanitizeName('  Simple  '));
    }
}
