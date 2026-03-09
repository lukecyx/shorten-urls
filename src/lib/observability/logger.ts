import { logs, Logger } from "@opentelemetry/api-logs";
import { Context as OtelContext } from "@opentelemetry/api";
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

let loggingInitialized = false;

export function initLogging() {
  if (loggingInitialized || !process.env.AWS_LAMBDA_EXEC_WRAPPER) {
    return;
  }

  loggingInitialized = true;

  const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "url-shortener",
    }),
    processors: [
      new SimpleLogRecordProcessor(
        new OTLPLogExporter({
          url: process.env.OTLP_ENDPOINT ?? "localhost:4317",
        }),
      ),
    ],
  });

  logs.setGlobalLoggerProvider(loggerProvider);
}

export function getLogger(otelCtx?: OtelContext, requestId?: string): Logger {
  const logger = logs.getLogger("url-shortener");

  return {
    emit: (record) =>
      logger.emit({
        ...record,
        ...(otelCtx && { context: otelCtx }),
        attributes: {
          ...(requestId && { requestId }),
          ...record.attributes,
        },
      }),
  };
}
