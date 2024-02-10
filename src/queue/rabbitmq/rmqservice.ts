import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/default.service';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {

  constructor(
      @Inject(ConfigService)
      private readonly configService: ConfigService
  ) {}

  getOptions(queue: string, noAck = false): RmqOptions {
    const rmqUrl = this.configService.get().rabbitmq.host;
    return {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: queue,
        noAck,
        persistent: true,
        queueOptions: {
          durable: true
        }
      },
    };
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }
}