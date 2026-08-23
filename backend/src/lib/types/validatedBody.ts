import { APIGatewayProxyEventV2 } from "aws-lambda";

export interface ValidatedBody<Tbody> extends Omit<
  APIGatewayProxyEventV2,
  "body"
> {
  body: Tbody;
}
