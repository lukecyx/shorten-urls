import { LambdaLoggingContext } from "~/lib/middleware/types";

export async function createUrl(
  event: any,
  context: LambdaLoggingContext,
): Promise<any> {
  context.logger.info("Hello from the createUrl controller!!");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "create url controller called" }),
  };
}

export async function redirect(
  event: any,
  context: LambdaLoggingContext,
): Promise<any> {
  console.log("redirect controlelr called");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "redirect controlelr called" }),
  };
}
