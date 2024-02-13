import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logservice';
import { trace, context } from '@opentelemetry/api';

export interface RequestLog extends Request {
  traceId?: string | string[];
  spanId?: string | string[];
  authorization: string | string[];
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware<Request, Response> {

  private responseBody: any[] = [];

  constructor(private logger: Logger) {}

  use(req: RequestLog, res: Response, next: () => void): void {
    const span = trace.getSpan(context.active());
    const { spanId, traceId } = trace.getSpan(context.active())?.spanContext();
    const before = Date.now();
    req.headers['X-Trace-Id'] = traceId == undefined ? traceId : uuidv4();
    req.headers['X-Span-Id'] = spanId == undefined ? spanId : '0';
    req.traceId = traceId
    req.spanId = spanId
    res.setHeader('X-Trace-Id', req.traceId);

    const originalWrite = res.write;
    const originalEnd = res.end;

    const chunks: any[] = [];

    res.write = (...args: any[]) => {
      chunks.push(args[0]);
      return originalWrite.apply(res, args);
    };

    res.end = (...args: any[]) => {
      if (args[0]) {
        chunks.push(args[0]);
      }
      this.responseBody.push(Buffer.concat(chunks).toString('utf8'));
      return originalEnd.apply(res, args);
    };

    next();

    res.on('close', () =>{
      this.logger.http(this.generateLogMessage(req, res, Date.now() - before))
    });
  }

  private generateLogMessage(req: RequestLog, res: Response, timeTaken: number): string {
    const size = this.getResponseSize(res);
    const message = `req = ${req.method} - ${req.originalUrl} | resp_size = ${size === 0 ? -1 : size} | req_duration = ${timeTaken}] | req_body = ${JSON.parse(JSON.stringify(req.body))} | res_code = ${res.statusCode} | res_body = ${JSON.parse(JSON.stringify(this.responseBody))}` // Using res.body for response body
    return message;
  }

  private getResponseSize(res: Response): number {
    const sizeRaw = res.getHeader('Content-Length');
    if (typeof sizeRaw === 'number') {
      return sizeRaw;
    }
    if (typeof sizeRaw === 'string') {
      const parsed = parseInt(sizeRaw, 10);
      if (isNaN(parsed)) {
        return 0;
      }
      return parsed;
    }
    return 0;
  }

}
