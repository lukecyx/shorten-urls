import { APIGatewayProxyEventV2 } from "aws-lambda";
import { ZodSchema } from "zod";
import middy from "@middy/core";

function validateRequestPart(
  schema: ZodSchema,
  part: string,
): middy.MiddlewareObj<APIGatewayProxyEventV2> {
  const before: middy.MiddlewareFn<APIGatewayProxyEventV2> = async (
    request,
  ) => {
    const partToValidate = request.event[part as keyof APIGatewayProxyEventV2];
    const parsed = schema.safeParse(partToValidate);

    if (!parsed.success) {
      return {
        headers: {
          "Content-Type": "application/json",
        },
        statusCode: 400,
        body: JSON.stringify(parsed.error.issues),
      };
    }

    request.event.body = parsed.data as APIGatewayProxyEventV2["body"];
  };

  return {
    before,
  };
}

export default validateRequestPart;
