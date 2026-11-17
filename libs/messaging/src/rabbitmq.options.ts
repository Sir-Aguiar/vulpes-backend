export const RABBITMQ_OPTIONS = Symbol('RABBITMQ_OPTIONS');

export type RabbitmqOptions = {
  url: string;
  consumePings: boolean;
};
