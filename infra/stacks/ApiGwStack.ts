import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";

interface Props extends cdk.StackProps {
  createFn: lambda.Function;
  redirectFn: lambda.Function;
}

export class ApiGwStack extends cdk.Stack {
  public readonly api: apigw.RestApi;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const apiResourcePolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ["execute-api:Invoke"],
          conditions: {
            NotIpAddress: {
              "aws:SourceIp": ["com.amazonaws.global.cloudfront.origin-facing"],
            },
          },
        }),
      ],
    });

    this.api = new apigw.RestApi(this, "DevApi", {
      restApiName: "dev-url-shortener",
      policy: apiResourcePolicy,
    });

    this.api.root
      .addResource("shorten")
      .addMethod("POST", new apigw.LambdaIntegration(props.createFn));

    this.api.root
      .addResource("{urlCode}")
      .addMethod("GET", new apigw.LambdaIntegration(props.redirectFn));
  }
}
