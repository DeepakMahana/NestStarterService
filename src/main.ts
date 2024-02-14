import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from './config/default.service';
import { RABBIT_MQ_REGISTRATION_QUEUE } from './constants/rmqueues';
import { MainModule } from './main.module';
import { RmqService } from './queue/rabbitmq/rmqservice';
import { createDocument } from './swagger/swagger.service';
import * as path from 'path';
import otelSDK  from './monitoring';
import * as hpropagate from 'hpropagate'

async function bootstrap() {
  await require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

  hpropagate({
    setAndPropagateCorrelationId: false,
    propagateInResponses: true,
    headersToPropagate: ["X-Trace-Id"],
  });

  await otelSDK.start();
  console.log('Started OTEL SDK');

  const app = await NestFactory.create(MainModule);
  const configService = app.get(ConfigService);
  
  // Validator Pipes
  app.useGlobalPipes(new ValidationPipe());
  
  const rmqService = app.get<RmqService>(RmqService)
  app.connectMicroservice(rmqService.getOptions(RABBIT_MQ_REGISTRATION_QUEUE, false));
  // Swagger Doc
  const document = createDocument(app);
  // Generate Swagger JSON file
  // fs.writeFileSync("./swagger-spec.json", JSON.stringify(document));
  SwaggerModule.setup('/swagger', app, document);
  
  // Enable Cors
  app.enableCors({ origin: '*' });
  app.enableShutdownHooks();

  await app.startAllMicroservices();
  await app.listen(configService.get().port);

  // Process uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // process.exit(1); // Exit with a non-zero code to indicate abnormal termination
  });
  // Process unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    console.error(promise);
    // You can also do additional handling here if needed.
  });
}
bootstrap();
