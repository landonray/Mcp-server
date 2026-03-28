<?php

declare(strict_types=1);

namespace OntraportMcp\Tests\Tools;

use OntraportMcp\McpError;
use OntraportMcp\Tools\Transactions;
use PHPUnit\Framework\TestCase;

class TransactionsTest extends TestCase
{
    private function mockClient(): object
    {
        return new class {
            public array $calls = [];

            public function get(string $path, array $params = []): array
            {
                $this->calls[] = ['get', $path, $params];
                return ['data' => []];
            }

            public function post(string $path, array $body = []): array
            {
                $this->calls[] = ['post', $path, $body];
                return ['data' => []];
            }

            public function put(string $path, array $body = []): array
            {
                $this->calls[] = ['put', $path, $body];
                return ['data' => []];
            }

            public function delete(string $path, array $params = [], array $body = []): array
            {
                $this->calls[] = ['delete', $path, $params];
                return ['data' => []];
            }
        };
    }

    public function testRefundTransaction(): void
    {
        $client = $this->mockClient();
        Transactions::refund_transaction($client, ['ids' => [1, 2]]);
        $this->assertEquals(['put', '/transaction/refund', ['ids' => [1, 2]]], $client->calls[0]);
    }

    public function testProcessTransactionWithChargeNowString(): void
    {
        $client = $this->mockClient();
        Transactions::process_transaction($client, [
            'contact_id' => 27,
            'cc_id' => 5,
            'gateway_id' => 1,
            'offer' => ['products' => [['id' => 1]]],
        ]);
        $body = $client->calls[0][2];
        $this->assertEquals('chargeNow', $body['chargeNow']);
        $this->assertEquals(5, $body['cc_id']);
        $this->assertEquals(1, $body['gateway_id']);
    }

    public function testProcessTransactionDefaultCard(): void
    {
        $client = $this->mockClient();
        Transactions::process_transaction($client, [
            'contact_id' => 27,
            'gateway_id' => 1,
            'offer' => ['products' => [['id' => 1]]],
        ]);
        $body = $client->calls[0][2];
        $this->assertArrayNotHasKey('cc_id', $body);
    }

    public function testProcessTransactionThrowsWithoutContactId(): void
    {
        $this->expectException(McpError::class);
        Transactions::process_transaction($this->mockClient(), ['gateway_id' => 1, 'offer' => []]);
    }

    public function testProcessTransactionThrowsWithoutGatewayId(): void
    {
        $this->expectException(McpError::class);
        Transactions::process_transaction($this->mockClient(), ['contact_id' => 27, 'offer' => []]);
    }

    public function testLogTransactionWithChargeLogString(): void
    {
        $client = $this->mockClient();
        Transactions::log_transaction($client, [
            'contact_id' => 27,
            'offer' => ['products' => [['id' => 1]]],
        ]);
        $body = $client->calls[0][2];
        $this->assertEquals('chargeLog', $body['chargeNow']);
    }

    public function testCreateInvoice(): void
    {
        $client = $this->mockClient();
        Transactions::create_invoice($client, [
            'contact_id' => 27,
            'gateway_id' => 1,
            'offer' => ['products' => [['id' => 1]]],
            'send_invoice' => true,
            'customer_note' => 'Thanks',
        ]);
        $this->assertEquals('post', $client->calls[0][0]);
        $this->assertEquals('/transaction/requestPayment', $client->calls[0][1]);
        $body = $client->calls[0][2];
        $this->assertEquals('requestPayment', $body['chargeNow']);
        $this->assertTrue($body['send_invoice']);
        $this->assertEquals('Thanks', $body['customer_note']);
    }

    public function testPayInvoice(): void
    {
        $client = $this->mockClient();
        Transactions::pay_invoice($client, ['invoice_id' => 3, 'cc_id' => 1]);
        $this->assertEquals(['post', '/transaction/payInvoice', ['invoice_id' => 3, 'cc_id' => 1]], $client->calls[0]);
    }

    public function testCancelSubscription(): void
    {
        $client = $this->mockClient();
        Transactions::cancel_subscription($client, ['ids' => [10, 11]]);
        $this->assertCount(2, $client->calls);
        $this->assertEquals(['delete', '/order', ['id' => 10]], $client->calls[0]);
        $this->assertEquals(['delete', '/order', ['id' => 11]], $client->calls[1]);
    }

    public function testDeleteOrder(): void
    {
        $client = $this->mockClient();
        Transactions::delete_order($client, ['id' => 10]);
        $this->assertEquals(['delete', '/order', ['id' => 10]], $client->calls[0]);
    }

    public function testGetOrder(): void
    {
        $client = $this->mockClient();
        Transactions::get_order($client, ['id' => 10]);
        $this->assertEquals(['get', '/transaction/order', ['id' => 10]], $client->calls[0]);
    }

    public function testUpdateOrder(): void
    {
        $client = $this->mockClient();
        $offer = ['offer_id' => 8, 'order_id' => 1, 'products' => [['id' => 1]]];
        Transactions::update_order($client, ['offer' => $offer]);
        $this->assertEquals(['put', '/transaction/order', ['offer' => $offer]], $client->calls[0]);
    }

    public function testUpdateOrderThrowsWithoutOffer(): void
    {
        $this->expectException(McpError::class);
        Transactions::update_order($this->mockClient(), []);
    }

    public function testUpdateOrderThrowsWithoutOrderId(): void
    {
        $this->expectException(McpError::class);
        Transactions::update_order($this->mockClient(), ['offer' => ['offer_id' => 1]]);
    }
}
