import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from './logservice';
import { trace, context, Span } from '@opentelemetry/api';

export interface RequestLog extends Request {
  traceId?: string | string[];
  spanId?: string | string[];
  authorization: string | string[];
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware<Request, Response> {

  private responseBody: any[] = [];
  private tracer = trace.getTracer('');

  constructor(private logger: Logger) {}

  use(req: RequestLog, res: Response, next: () => void): void {

    const before = Date.now();

    // Start a new trace span
    const span: Span = this.tracer.startSpan(`${req.originalUrl} | request/response`);
    
    // Set headers
    const { spanId, traceId } = span.spanContext();
    req.headers['X-Trace-Id'] = req.headers['X-Trace-Id'] || traceId;
    req.traceId = traceId;
    req.spanId = spanId;
    res.setHeader('X-Trace-Id', req.traceId);

    // Log the request
    this.logRequest(req, span);

    // Override response methods to capture response data
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
      this.logResponse(req, res, before, span);
      return originalEnd.apply(res, args);
    };

    // Ensure to end the span when response is closed
    res.on('close', () => {
      span.end();
    });

    // Move to the next middleware
    next();
  }

  private logRequest(req: RequestLog, span: Span): void {
    // Log request details
    span.setAttribute('method', req.method)
    span.addEvent('Request', {
      url: req.originalUrl,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : ""
    });
    const message = `Incoming Request - Method: ${req.method}, URL: ${req.originalUrl}, Body: ${req.method !== 'GET' ? JSON.stringify(req.body) : ''}`;
    this.logger.http(message);
  }

  private logResponse(req: RequestLog, res: Response, before: number, span: Span): void {
    // Log response details
    const timeTaken = Date.now() - before;
    const size = this.getResponseSize(res);
    const message = `Outgoing Response - Method: ${req.method}, URL: ${req.originalUrl}, Body: ${this.responseBody}, Status: ${res.statusCode}, Time Taken: ${timeTaken}ms, Size: ${size} Bytes`;
    span.addEvent('Response', {
      url: req.originalUrl,
      body: JSON.parse(JSON.stringify(this.responseBody[0]))
    });
    span.setAttribute('status_code', res.statusCode)
    span.setAttribute('time_taken', `${timeTaken} ms`)
    span.setAttribute('resp_size', `${size} bytes`)
    this.logger.http(message);
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
