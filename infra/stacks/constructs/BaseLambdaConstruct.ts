import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import { ISecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";

export interface BaseLambdaProps {
  entry: string;
  handler?: string;
  environment?: Record<string, string>;
  timeoutSeconds?: number;
  memorySize?: number;
  securityGroups?: ISecurityGroup[];
  vpc?: Vpc;
}

export class BaseLambdaConstruct extends Construct {
  public readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: BaseLambdaProps) {
    super(scope, id);

    this.fn = new NodejsFunction(this, "Lambda", {
      entry: props.entry,
      handler: props.handler ?? "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(props.timeoutSeconds ?? 10),
      memorySize: props.memorySize ?? 256,
      environment: props.environment,
      securityGroups: props.securityGroups ?? [],
      vpc: props.vpc,

      // bundling: {
      //   target: "node20",
      //   minify: true,
      //   sourceMap: true,
      //   externalModules: ["aws-sdk"], // always exclude
      // },
    });
  }
}
