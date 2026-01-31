import { LambdaLoggingContext } from "~/lib/middleware/types";
import { createUrl as _createUrl } from "../services/urls/service";
import { CreateUrlBody } from "~/lib/types/createUrl";
import { ValidatedAPIGatewayProxyEventV2 } from "~/lib/interfaces";
import { RedirectPathParams } from "~/lib/types";

export async function createUrl(
  event: ValidatedAPIGatewayProxyEventV2<CreateUrlBody>,
  context: LambdaLoggingContext,
): Promise<any> {
  console.log("about to log");
  context.logger.info("Hello from the createUrl controller!!");
  const ret = await _createUrl("google.co.uk");

  return {
    statusCode: 200,
    body: "Hello from createURL controller",
  };
}

export async function redirect(
  event: ValidatedAPIGatewayProxyEventV2<RedirectPathParams>,
  context: LambdaLoggingContext,
): Promise<any> {
  console.log("context", context);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "hi" }),
  };
  // return {
  //   statusCode: 302,
  //   headers: {
  //     location: "www.google.co.uk",
  //   },
  // };
}
