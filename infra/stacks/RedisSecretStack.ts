import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as crypto from "crypto";

export interface RedisSecretStackProps extends cdk.StackProps {
  stage: string;
}

export class RedisSecretStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RedisSecretStackProps) {
    super(scope, id, props);

    const password = crypto
      .randomBytes(24)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 32); // 16–128 chars, ASCII-only

    new ssm.StringParameter(this, "RedisAuthToken", {
      parameterName: `/${props.stage}/redis/auth-token`,
      stringValue: password,
      dataType: ssm.ParameterDataType.TEXT,
    });
  }
}
