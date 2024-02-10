import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import {
    CompositePropagator,
    W3CTraceContextPropagator,
    W3CBaggagePropagator,
  } from '@opentelemetry/core';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';

const exporterOptions = {
  url: 'http://localhost:4317', // grcp
};

const traceExporter = new OTLPTraceExporter(exporterOptions);
const spanProcessor = new BatchSpanProcessor(traceExporter);

const otelSDK = new NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'starterkit',
    }),
    traceExporter,
    spanProcessor: spanProcessor,
    contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [
        new NestInstrumentation(),
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new MongoDBInstrumentation(),
        new MongooseInstrumentation(),
        new AmqplibInstrumentation(),
        new WinstonInstrumentation()
    ],
    textMapPropagator: new CompositePropagator({
        propagators: [
        new JaegerPropagator(),
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
        new B3Propagator(),
        new B3Propagator({
            injectEncoding: B3InjectEncoding.MULTI_HEADER,
        }),
        ]
    })
});

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
    otelSDK
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export default otelSDK;
