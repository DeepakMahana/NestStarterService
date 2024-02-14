import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '../config/default.module';
import { Logger } from './logservice';
import { LoggerMiddleware } from './logmiddleware';


@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [Logger],
  exports: [Logger],
})
export class AppLoggerModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware)
    .exclude({path: '/metrics', method: RequestMethod.GET})
    .forRoutes('*');
  }
}