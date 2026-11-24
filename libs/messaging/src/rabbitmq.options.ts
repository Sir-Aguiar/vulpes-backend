export const RABBITMQ_OPTIONS = Symbol('RABBITMQ_OPTIONS');

export const MESSAGING_CONSUMERS = ['ping'] as const;

export type MessagingConsumer = (typeof MESSAGING_CONSUMERS)[number];

export type RabbitmqOptions = {
  url: string;
  consumers: MessagingConsumer[];
};
