import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PrettyConsoleLogExporter } from "./consoleExporter";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

let sdk: NodeSDK | null = null;

export function initSDK() {
  // NOTE: AWS_LAMBDA_EXEC_WRAPPER is only set when deployed (BaseLambdaConstruct);
  // there the ADOT layer already handles instrumentation, so this manual SDK is
  // local-dev only, exporting to OTLP_ENDPOINT (the docker otel-lgtm collector).
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
      new SimpleLogRecordProcessor(new PrettyConsoleLogExporter()),
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
