import { Injectable, Scope, LoggerService } from '@nestjs/common';
import * as moment from 'moment';
import * as winston from 'winston';
import { LogLevel, isLogLevel } from './loglevel';
import { trace, context, Span } from '@opentelemetry/api';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.initializeLogger();
  }

  private initializeLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message }) => {
              return `[${timestamp}] - [${level}] - ${message}`;
            }),
          ),
          stderrLevels: [LogLevel.Error, LogLevel.Warn],
        }),
      ],
    });
  }

  log(level: LogLevel | string, message: string, meta?: any) {
    const logLevel = isLogLevel(level) ? level : LogLevel.Info;
    let logMessage = `[${moment().format('ddd MMM DD HH:mm:ss YYYY')}] - [${message}]`;

    if(logLevel != LogLevel.HTTP){
      // Retrieve the current span context
      const span = trace.getSpan(context.active());
      if (span) {
        const { traceId } = span.spanContext();
        // Construct log message with trace and span IDs
        logMessage = `[${moment().format('ddd MMM DD HH:mm:ss YYYY')}] - [${traceId}] - [${message}]`;
        span.addEvent(message);
      }
    }
    this.logger.log(LogLevel.Info, logMessage, meta);
  }

  setDefaultMeta(correlationId: string) {
    // You can implement this if you need default metadata
  }

  error(message: string) {
    this.log(LogLevel.Error, message);
  }

  warn(message: string) {
    this.log(LogLevel.Warn, message);
  }

  info(message: string) {
    this.log(LogLevel.Info, message);
  }

  http(message: string) {
    this.log(LogLevel.HTTP, message);
  }

  verbose(message: string) {
    this.log(LogLevel.Verbose, message);
  }

  debug(message: string) {
    this.log(LogLevel.Debug, message);
  }
}
