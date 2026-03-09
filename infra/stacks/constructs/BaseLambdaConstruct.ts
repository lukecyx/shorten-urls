import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { ISecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

export interface BaseLambdaProps {
  entry: string;
  handler?: string;
  environment?: Record<string, string>;
  timeoutSeconds?: number;
  memorySize?: number;
  securityGroups?: ISecurityGroup[];
  vpc?: Vpc;
  layers: lambda.ILayerVersion[];
}

export class BaseLambdaConstruct extends Construct {
  public readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: BaseLambdaProps) {
    super(scope, id);

    const adotLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "AdotLayer",
      "arn:aws:lambda:eu-west-2:901920570463:layer:aws-otel-nodejs-amd64-ver-1-30-0:1",
    );

    const grafanaConfig = secretsmanager.Secret.fromSecretNameV2(
      this,
      "GrafanaConfigSecret",
      "GrafanaConfig",
    );

    this.fn = new NodejsFunction(this, "Lambda", {
      entry: props.entry,
      handler: props.handler ?? "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(props.timeoutSeconds ?? 10),
      memorySize: props.memorySize ?? 512,
      environment: {
        ...props.environment,
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/otel-handler",
        OTEL_LOG_LEVEL: "error",
      },
      securityGroups: props.securityGroups ?? [],
      vpc: props.vpc,
      layers: [...props.layers, adotLayer],
    });

    grafanaConfig.grantRead(this.fn);

    const otelEndpoint = grafanaConfig.secretValueFromJson("otelEndpoint");
    this.fn.addEnvironment(
      "OTEL_EXPORTER_OTLP_ENDPOINT",
      otelEndpoint.toString(),
    );
    const otelHeader = grafanaConfig.secretValueFromJson("otelHeader");
    this.fn.addEnvironment("OTEL_EXPORTER_OTLP_HEADERS", otelHeader.toString());
  }
}
