import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { ISecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";

export interface BaseLambdaProps {
  entry: string;
  handler?: string;
  environment?: Record<string, string>;
  timeoutSeconds?: number;
  memorySize?: number;
  securityGroups?: ISecurityGroup[];
  vpc?: Vpc;
  layers?: lambda.ILayerVersion[] | undefined;
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
      layers: [adotLayer, ...(props.layers ?? [])],
    });

    // Each param holds a single plain string value (not JSON):
    //   /grafana/otel-endpoint -> e.g. "https://otlp-gateway-<region>.grafana.net/otlp"
    //   /grafana/otel-header   -> e.g. "Authorization=Basic <base64(instanceID:token)>"
    // SecureString dynamic references need an explicit version — bump these
    // when the parameter values are rotated.
    const otelEndpoint = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "OtelEndpointParam",
      { parameterName: "/grafana/otel-endpoint", version: 1 },
    ).stringValue;
    this.fn.addEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", otelEndpoint);

    const otelHeader = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "OtelHeaderParam",
      { parameterName: "/grafana/otel-header", version: 1 },
    ).stringValue;
    this.fn.addEnvironment("OTEL_EXPORTER_OTLP_HEADERS", otelHeader);
  }
}
