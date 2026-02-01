import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";

import { BaseLambdaConstruct } from "./constructs";

export interface LambdaStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
  redisSecurityGroup: ec2.SecurityGroup;
}

export class LambdaStack extends cdk.Stack {
  public readonly createFn: lambda.Function;
  public readonly redirectFn: lambda.Function;
  public readonly lambdaSG: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.lambdaSG = new ec2.SecurityGroup(this, "LambdaSG", { vpc: props.vpc });

    const createLambda = new BaseLambdaConstruct(this, "CreateUrlLambda", {
      entry: "src/urls/handlers/createUrl.ts",
      securityGroups: [this.lambdaSG],
      vpc: props.vpc,
    });
    this.createFn = createLambda.fn;

    const redirectLambda = new BaseLambdaConstruct(this, "RedirectLambda", {
      entry: "src/urls/handlers/redirect.ts",
      securityGroups: [this.lambdaSG],
      vpc: props.vpc,
    });
    this.redirectFn = redirectLambda.fn;

    props.dbSecurityGroup.addIngressRule(this.lambdaSG, ec2.Port.tcp(5432));
    props.redisSecurityGroup.addIngressRule(this.lambdaSG, ec2.Port.tcp(6379));
  }
}
