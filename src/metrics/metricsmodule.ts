import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ApiMetricsMiddleware } from './metricsmiddleware';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { AppLoggerModule } from 'src/logger/logmodule';
import { Logger } from 'src/logger/logservice';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: false,
      },
    }),
    AppLoggerModule
  ],
  providers: [
    Logger,
    makeHistogramProvider({name: "http_request_duration_milliseconds", help: "Total Time", labelNames:["method", "route", "code"]}),
    makeHistogramProvider({name: "http_request_size_bytes", help: "Request Size (Byte)", labelNames:["method", "route", "code"]}),
    makeHistogramProvider({name: "http_response_size_bytes", help: "Response Size (Byte)", labelNames:["method", "route", "code"]}),
    makeCounterProvider({name: "http_all_request_total", help: "Total Request Count", labelNames:["method", "route", "code"]}),
    makeCounterProvider({name: "http_all_success_total", help: "Total Success Count", labelNames:["method", "route", "code"]}),
    makeCounterProvider({name: "http_all_errors_total", help: "Total Errors Count", labelNames:["method", "route", "code"]}),
    makeCounterProvider({name: "http_request_total", help: "Total Request Info", labelNames:["method", "route", "code"]}),
  ],
})
export class ApiMetricsModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(ApiMetricsMiddleware)
    .exclude({path: '/metrics', method: RequestMethod.GET})
    .forRoutes('*');
  }
}