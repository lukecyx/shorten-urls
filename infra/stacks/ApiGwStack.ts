import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

interface Props extends cdk.StackProps {
  createFn: lambda.Function;
  redirectFn: lambda.Function;
}

export class ApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const api = new apigw.RestApi(this, "DevApi", {
      restApiName: "dev-url-shortener",
    });

    api.root
      .addResource("shorten")
      .addMethod("POST", new apigw.LambdaIntegration(props.createFn));

    api.root
      .addResource("{code}")
      .addMethod("GET", new apigw.LambdaIntegration(props.redirectFn));
  }
}
