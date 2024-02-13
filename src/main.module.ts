import { Module } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { AppLoggerModule } from './logger/logmodule';
import { ConfigModule } from './config/default.module';
import { RmqService } from './queue/rabbitmq/rmqservice';

@Module({
  imports: [
    ConfigModule,
    AppLoggerModule,
    AppModule,
  ],
  exports: [],
  providers: [RmqService],
})
export class MainModule {}
