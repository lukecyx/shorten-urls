import winston from "winston";

let logger: winston.Logger | undefined;

export const getLogger = () => {
  if (!logger) {
    logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const metaString = Object.keys(meta).length > 0 ? `${JSON.stringify(meta, null, 2)}` : "";

          if (stack) {
            return `${timestamp} ${level}: ${stack} ${metaString}` + "<-- 1";
          }

          return `${timestamp} ${level}: ${message} ${metaString}` + `<-- 2`;
        }),
      ),
      transports: [new winston.transports.Console()],
      // Set defaultMetadataMerge to true to ensure child logger metadata is included.
      defaultMeta: {},
    });
  }

  return logger;
};
