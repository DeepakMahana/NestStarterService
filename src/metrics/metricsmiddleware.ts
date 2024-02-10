import { Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from 'src/logger/logservice';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { NextFunction, Request, Response } from 'express';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class ApiMetricsMiddleware implements NestMiddleware {

  private responseBody: any[] = [];

  constructor(
    private logger: Logger,
    @InjectMetric('http_request_duration_milliseconds') private responseTimeHistogram: Histogram<string>,
    @InjectMetric('http_request_size_bytes') private requestSizeHistogram: Histogram<string>,
    @InjectMetric('http_response_size_bytes') private responseSizeHistogram: Histogram<string>,
    @InjectMetric('http_all_request_total') private allRequestTotal: Counter<string>,
    @InjectMetric('http_all_success_total') private allSuccessTotal: Counter<string>,
    @InjectMetric('http_all_errors_total') private allErrorsTotal: Counter<string>,
    @InjectMetric('http_request_total') private requestTotal: Counter<string>
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    this.logRequestDetails(req);

    req.on('end', () => {
      const responseTime = Date.now() - start;
      const responseLength = parseInt(res.get('Content-Length')) || 0;

      this.logResponseDetails(res, responseTime);

      const labels = {
        method: req.method,
        route: this.getRoute(req),
        code: res.statusCode.toString(),
      };

      this.requestSizeHistogram.observe(labels, parseInt(req.get('content-length')) || 0);
      this.responseTimeHistogram.observe(labels, responseTime);
      this.responseSizeHistogram.observe(labels, responseLength);
      this.requestTotal.labels(req.method, labels.route, labels.code).inc();
      this.countResponse(res);
    });

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
  }

  private logRequestDetails(req: Request) {
    this.logger.info(`Received ${req.method} request to ${req.url}`);
    this.logger.info(`Request Headers: ${JSON.stringify(req.headers)}`);
    this.logger.info(`Request Body: ${JSON.stringify(req.body)}`);
  }

  private logResponseDetails(res: Response, responseTime: number) {
    this.logger.info(`Responded with status ${res.statusCode} in ${responseTime}ms`);
    this.logger.info(`Response Headers: ${JSON.stringify(res.getHeaders())}`);
    const responseBody = this.responseBody.join('');
    this.logger.info(`Response Body: ${responseBody}`);
  }

  private getRoute(req: Request): string {
    if (!req.route) {
      return 'N/A';
    }

    let route = req.baseUrl + req.route.path;

    if (typeof req.params === 'object') {
      Object.keys(req.params).forEach((paramName) => {
        route = route.replace(req.params[paramName], ':' + paramName);
      });
    }

    return route;
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
