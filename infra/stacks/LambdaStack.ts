import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

import { BaseLambdaConstruct } from "./constructs";
import path from "path";

export interface LambdaStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
  dbSecret: secretsmanager.ISecret;
  redisSecurityGroup: ec2.SecurityGroup;
}

export class LambdaStack extends cdk.Stack {
  public readonly createFn: lambda.Function;
  public readonly redirectFn: lambda.Function;
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

    const redirectLambda = new BaseLambdaConstruct(this, "RedirectLambda", {
      entry: "src/urls/handlers/redirect.ts",
      securityGroups: [this.lambdaSG],
      vpc: props.vpc,
      layers: [],
      environment: {
        DB_SECRET_ARN: props.dbSecret.secretArn,
      },
    });
    props.dbSecret.grantRead(redirectLambda.fn);
    this.redirectFn = redirectLambda.fn;

    props.dbSecurityGroup.addIngressRule(this.lambdaSG, ec2.Port.tcp(5432));
    props.redisSecurityGroup.addIngressRule(this.lambdaSG, ec2.Port.tcp(6379));
  }
}
