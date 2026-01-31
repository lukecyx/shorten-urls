import { APIGatewayProxyEventV2 } from "aws-lambda";

export interface ValidatedAPIGatewayProxyEventV2<T> extends Omit<
  APIGatewayProxyEventV2,
  "body"
> {
  body: T;
}
