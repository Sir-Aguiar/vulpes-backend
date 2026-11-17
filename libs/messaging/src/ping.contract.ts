export const PING_EXCHANGE = 'vulpes.ping';
export const PING_ROUTING_KEY = 'ping';
export const PING_QUEUE = 'game-service.ping';
export const PING_TIMEOUT_MS = 3000;

export type PingMessage = {
  type: 'ping';
  sentAt: string;
};

export type PongMessage = {
  type: 'pong';
  sentAt: string;
  receivedAt: string;
};
