import { type Channel } from 'amqplib';
import { PING_EXCHANGE, PING_QUEUE, PING_ROUTING_KEY } from '../contracts/ping.contract';

export async function assertPingTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(PING_EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(PING_QUEUE, { durable: true });
  await channel.bindQueue(PING_QUEUE, PING_EXCHANGE, PING_ROUTING_KEY);
}
