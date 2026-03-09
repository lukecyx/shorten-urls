import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
  ConsoleLogRecordExporter,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

let sdk: NodeSDK | null = null;

export function initSDK() {
  if (sdk || process.env.AWS_LAMBDA_EXEC_WRAPPER) {
    return;
  }

  const base = process.env.OTLP_ENDPOINT;

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "url-shortener",
    }),
    spanProcessors: [
      new SimpleSpanProcessor(
        new OTLPTraceExporter({ url: base ? `${base}/v1/traces` : undefined }),
      ),
    ],
    logRecordProcessors: [
      new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
      ...(base
        ? [
            new SimpleLogRecordProcessor(
              new OTLPLogExporter({ url: `${base}/v1/logs` }),
            ),
          ]
        : []),
    ],
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
}
