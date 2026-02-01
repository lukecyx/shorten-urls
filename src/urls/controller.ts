import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from "aws-lambda";
import { LambdaLoggingContext } from "~/lib/middleware/types";

export async function createUrl(
  event: APIGatewayProxyEvent,
  context: LambdaLoggingContext,
): Promise<APIGatewayProxyResultV2> {
  context.logger.info("Hello from the createUrl controller!!");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "create url controller called" }),
  };
}

export async function redirect(
  event: APIGatewayProxyEvent,
  context: LambdaLoggingContext,
): Promise<APIGatewayProxyResultV2> {
  console.log("redirect controlelr called");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "redirect controlelr called" }),
  };
}
