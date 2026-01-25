import pino from "pino";

let logger: pino.Logger | undefined;

export const getLogger = () => {
  if (!logger) {
    logger = pino({
      level: process.env.LOG_LEVEL || "info",
    });

    return logger;
  }

  return logger;
};
