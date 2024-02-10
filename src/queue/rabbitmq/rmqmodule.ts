import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from 'src/config/default.module';
import { ConfigService } from 'src/config/default.service';
import { ClientsModule, RmqOptions, Transport } from '@nestjs/microservices';
import { RABBIT_MQ_REGISTRATION_QUEUE } from '../../constants/rmqueues';



interface RmqModuleOptions {
  name: string;
}

@Module({})
export class RmqModule {

  public static getRmqConnectionOptions(config: ConfigService, queue:string): RmqOptions {
    const rmqhost = config.get().rabbitmq.host
    // const queue = RABBIT_MQ_REGISTRATION_QUEUE;
    if (!rmqhost) {
      throw new Error('Rmq config is missing');
    }
    return {
     transport: Transport.RMQ,
     options: {
      urls: [rmqhost],
      queue: queue,
      queueOptions: {
        durable: true
      },
      noAck: false
     }
    };
  }

  public static register({ name }: RmqModuleOptions): DynamicModule {
    
    return {
      module: RmqModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: name,
            useFactory: (config: ConfigService) => RmqModule.getRmqConnectionOptions(config, name),
            imports: [ConfigModule],
            inject: [ConfigService]
          },
        ])
      ],
      exports: [ClientsModule],
    };
  }
}