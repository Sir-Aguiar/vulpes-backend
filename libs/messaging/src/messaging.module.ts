import { DynamicModule, Module, type InjectionToken } from '@nestjs/common';
import { RabbitmqConnection } from './connection/rabbitmq.connection';
import { PingConsumer } from './ping/ping.consumer';
import { PingPublisher } from './ping/ping.publisher';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from './rabbitmq.options';
import { Consumer } from './transport/consumer';
import { Publisher } from './transport/publisher';

const providers = [
  RabbitmqConnection,
  Publisher,
  Consumer,
  PingPublisher,
  PingConsumer,
];

@Module({})
export class MessagingModule {
  static register(options: RabbitmqOptions): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        { provide: RABBITMQ_OPTIONS, useValue: options },
        ...providers,
      ],
      exports: [PingPublisher, Publisher],
    };
  }

  static registerAsync(options: {
    imports?: DynamicModule['imports'];
    inject?: InjectionToken[];
    useFactory: (
      ...args: any[]
    ) => RabbitmqOptions | Promise<RabbitmqOptions>;
  }): DynamicModule {
    return {
      module: MessagingModule,
      imports: options.imports,
      providers: [
        {
          provide: RABBITMQ_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ...providers,
      ],
      exports: [PingPublisher, Publisher],
    };
  }
}
