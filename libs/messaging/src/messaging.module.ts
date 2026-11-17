import { DynamicModule, Module, type InjectionToken } from '@nestjs/common';
import { PingListener } from './ping.listener';
import { RabbitmqClient } from './rabbitmq.client';
import { RABBITMQ_OPTIONS, type RabbitmqOptions } from './rabbitmq.options';

@Module({})
export class MessagingModule {
  static register(options: RabbitmqOptions): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        { provide: RABBITMQ_OPTIONS, useValue: options },
        RabbitmqClient,
        PingListener,
      ],
      exports: [RabbitmqClient],
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
        RabbitmqClient,
        PingListener,
      ],
      exports: [RabbitmqClient],
    };
  }
}
