import { Context } from "aws-lambda";
import pino from "pino";

export interface LambdaLoggingContext extends Context {
  logger: pino.Logger;
}
