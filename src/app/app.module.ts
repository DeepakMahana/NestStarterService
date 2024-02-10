import { Module, Type } from '@nestjs/common';
import { DatabaseModule } from '../db/mongo/mongo.module';
import { Brand, BrandSchema } from '../app/model/brand';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrationController } from './controllers/registration';
import { RegistrationService } from './services/registration';
import { AppLoggerModule } from 'src/logger/logmodule';
import { RmqModule } from 'src/queue/rabbitmq/rmqmodule';
import { RmqService } from 'src/queue/rabbitmq/rmqservice';
import { ConfigModule } from 'src/config/default.module';
import { RABBIT_MQ_REGISTRATION_QUEUE } from 'src/constants/rmqueues';
import { BrandRegistrationRepository } from './repository/registration';
import { ElasticModule } from 'src/db/elk/elk.module';

@Module({
  imports: [
    ConfigModule,
    AppLoggerModule,
    DatabaseModule.forRoot(),
    MongooseModule
    .forFeature(
      [
        { name: Brand.name, schema: BrandSchema }
      ]
    ),
    RmqModule.register({name: RABBIT_MQ_REGISTRATION_QUEUE}),
    ElasticModule.elkRegister()
  ],
  providers: [RmqService, RegistrationService, BrandRegistrationRepository],
  exports: [RegistrationService],
  controllers: [RegistrationController],
})
export class AppModule {}