import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as sqs from "aws-cdk-lib/aws-sqs";

import { BaseLambdaConstruct } from "./constructs";
import path from "path";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface LambdaStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
  dbSecret: secretsmanager.ISecret;
  redisSecurityGroup: ec2.SecurityGroup;
  urlAnalyticsQueue: sqs.Queue;
}

export class LambdaStack extends cdk.Stack {
  public readonly createFn: lambda.Function;
  public readonly redirectFn: lambda.Function;
  public readonly analyticsFn: lambda.Function;
  public readonly lambdaSG: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.lambdaSG = new ec2.SecurityGroup(this, "LambdaSG", { vpc: props.vpc });

    const feistelSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "FeistelSecret",
      "FeistelKey",
    );
    const domainBitsSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "DomainBitsSecret",
      "DomainBits",
    );
    const feistelRoundsSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "FeistelRoundsSecret",
      "FeistelRounds",
    );

    const snowflakeLayer = new lambda.LayerVersion(this, "SnowflakeLayer", {
      code: lambda.Code.fromAsset(
        path.join(import.meta.dirname, "../lambda-layers/snowflake/dist"),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "Snowflake ID generation utility",
    });

    const encodingLayer = new lambda.LayerVersion(this, "EncodingLayer", {
      code: lambda.Code.fromAsset(
        path.join(import.meta.dirname, "../lambda-layers/encoding/dist"),
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "Feistel network and Base58 encoding utilities",
    });

    // CreateUrlLambda
    const createLambda = new BaseLambdaConstruct(this, "CreateUrlLambda", {
      entry: "src/urls/handlers/createUrl.ts",
      securityGroups: [this.lambdaSG],
      vpc: props.vpc,
      layers: [snowflakeLayer, encodingLayer],
      timeoutSeconds: 30,
      environment: {
        FEISTEL_SECRET_ARN: feistelSecret.secretArn,
        FEISTEL_ROUNDS_ARN: feistelRoundsSecret.secretArn,
        DOMAIN_BITS_ARN: domainBitsSecret.secretArn,
        CODE_BASE: "58",
        CODE_LENGTH: "6",
        DB_SECRET_ARN: props.dbSecret.secretArn,
      },
    });

    feistelSecret.grantRead(createLambda.fn);
    domainBitsSecret.grantRead(createLambda.fn);
    feistelRoundsSecret.grantRead(createLambda.fn);
    props.dbSecret.grantRead(createLambda.fn);

    this.createFn = createLambda.fn;

    // RedirectLambda
    const redirectLambda = new BaseLambdaConstruct(this, "RedirectLambda", {
      entry: "src/urls/handlers/redirect.ts",
      securityGroups: [this.lambdaSG],
      vpc: props.vpc,
      layers: [],
      environment: {
        DB_SECRET_ARN: props.dbSecret.secretArn,
        ANALYTICS_QUEUE_URL: props.urlAnalyticsQueue.queueUrl,
      },
    });
    props.dbSecret.grantRead(redirectLambda.fn);
    props.urlAnalyticsQueue.grantSendMessages(redirectLambda.fn);
    this.redirectFn = redirectLambda.fn;

    // AnalyticsLambda
    const analyticsLambda = new BaseLambdaConstruct(
      this,
      "UrlAnalyticsHandler",
      {
        entry: "src/urls/handlers/analytics.ts",
        securityGroups: [this.lambdaSG],
        vpc: props.vpc,
        timeoutSeconds: 30,
      },
    );

    this.analyticsFn = analyticsLambda.fn;

    props.urlAnalyticsQueue.grantSendMessages(this.analyticsFn);
    this.analyticsFn.addEventSource(
      new SqsEventSource(props.urlAnalyticsQueue, { batchSize: 10 }),
    );

    // SG Ingress
    new ec2.CfnSecurityGroupIngress(this, "DbIngressFromLambda", {
      groupId: props.dbSecurityGroup.securityGroupId,
      ipProtocol: "tcp",
      fromPort: 5432,
      toPort: 5432,
      sourceSecurityGroupId: this.lambdaSG.securityGroupId,
    });
    new ec2.CfnSecurityGroupIngress(this, "RedisIngressFromLambda", {
      groupId: props.redisSecurityGroup.securityGroupId,
      ipProtocol: "tcp",
      fromPort: 6379,
      toPort: 6379,
      sourceSecurityGroupId: this.lambdaSG.securityGroupId,
    });
  }
}
