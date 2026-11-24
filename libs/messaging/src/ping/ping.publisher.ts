import { Injectable } from '@nestjs/common';
import { type ConsumeMessage } from 'amqplib';
import { RabbitmqConnection } from '../connection/rabbitmq.connection';
import {
  PING_EXCHANGE,
  PING_ROUTING_KEY,
  PING_TIMEOUT_MS,
  type PingMessage,
  type PongMessage,
} from '../contracts/ping.contract';
import { Publisher } from '../transport/publisher';
import { assertPingTopology } from './ping.topology';

@Injectable()
export class PingPublisher {
  constructor(
    private readonly connection: RabbitmqConnection,
    private readonly publisher: Publisher,
  ) {}

  async ping(timeoutMs = PING_TIMEOUT_MS): Promise<PongMessage> {
    const channel = await this.connection.getChannel();
    await assertPingTopology(channel);
    const payload: PingMessage = {
      type: 'ping',
      sentAt: new Date().toISOString(),
    };

    return this.publisher.rpc({
      exchange: PING_EXCHANGE,
      routingKey: PING_ROUTING_KEY,
      payload,
      timeoutMs,
      timeoutMessage: `game-service não respondeu ao ping em ${timeoutMs}ms. Confirme que ele está no ar.`,
      parse: readPong,
    });
  }
}

function readPong(message: ConsumeMessage): PongMessage {
  const body = JSON.parse(message.content.toString()) as Partial<PongMessage>;
  if (body.type !== 'pong' || !body.sentAt || !body.receivedAt) {
    throw new Error('Resposta do game-service não é um pong.');
  }

  return {
    type: 'pong',
    sentAt: body.sentAt,
    receivedAt: body.receivedAt,
  };
}
