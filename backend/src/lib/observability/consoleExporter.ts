import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { ReadableLogRecord, LogRecordExporter } from "@opentelemetry/sdk-logs";

const LEVEL_COLORS: Record<string, string> = {
  ERROR: "\x1b[31m",
  WARN: "\x1b[33m",
  INFO: "\x1b[36m",
  DEBUG: "\x1b[90m",
};
const RESET = "\x1b[0m";

export class PrettyConsoleLogExporter implements LogRecordExporter {
  export(
    records: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    for (const record of records) {
      const level = record.severityText ?? "INFO";
      const color = LEVEL_COLORS[level] ?? "";
      const attrs = record.attributes ?? {};
      const attrsStr =
        Object.keys(attrs).length > 0
          ? " " + JSON.stringify(attrs)
          : "";

      process.stdout.write(
        `${color}[${level}]${RESET} ${record.body}${attrsStr}\n`,
      );
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
