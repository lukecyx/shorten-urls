import { Context } from "aws-lambda";
import { RequestContext } from "~/lib/types/context";

export interface LambdaLoggingContext extends Context {
  requestContext: RequestContext;
}
