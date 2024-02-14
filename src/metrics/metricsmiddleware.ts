import { Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from 'src/logger/logservice';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { NextFunction, Request, Response } from 'express';
import { Counter, Histogram } from 'prom-client';
import { trace, context, Span } from '@opentelemetry/api';

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {

  constructor(
    @InjectMetric('http_request_duration_milliseconds') private responseTimeHistogram: Histogram<string>,
    @InjectMetric('http_request_size_bytes') private requestSizeHistogram: Histogram<string>,
    @InjectMetric('http_response_size_bytes') private responseSizeHistogram: Histogram<string>,
    @InjectMetric('http_all_request_total') private allRequestTotal: Counter<string>,
    @InjectMetric('http_all_success_total') private allSuccessTotal: Counter<string>,
    @InjectMetric('http_all_errors_total') private allErrorsTotal: Counter<string>,
    @InjectMetric('http_request_total') private requestTotal: Counter<string>
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    
    const span = trace.getSpan(context.active());
    const { traceId } = span.spanContext();

    const start = Date.now();
     
    const responseTime = Date.now() - start;
    const responseLength = parseInt(res.get('Content-Length')) || 0;

    const labels = {
    method: req.method,
    route: req.originalUrl,
    code: res.statusCode.toString(),
    traceid: traceId
    };

    this.requestSizeHistogram.observe(labels, parseInt(req.get('content-length')) || 0);
    this.responseTimeHistogram.observe(labels, responseTime);
    this.responseSizeHistogram.observe(labels, responseLength);
    this.requestTotal.labels(req.method, labels.route, labels.code, labels.traceid).inc();
    this.countResponse(res);
    
    next();
  }

  private countResponse(res: Response) {
    this.allRequestTotal.inc();
    const codeClass = this.getStatusCodeClass(res.statusCode);

    switch (codeClass) {
      case 'success':
        this.allSuccessTotal.inc();
        break;
      case 'error':
        this.allErrorsTotal.inc();
        break;
    }
  }

  private getStatusCodeClass(code: number): string {
    if (code < 400) return 'success';
    return 'error';
  }
}