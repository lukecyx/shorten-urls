import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface Props extends cdk.StackProps {
  createFn: lambda.Function;
  redirectFn: lambda.Function;
}

export class ApiGwStack extends cdk.Stack {
  public readonly api: apigw.RestApi;
  public readonly originVerifySecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.originVerifySecret = new secretsmanager.Secret(
      this,
      "OriginVerifySecret",
      {
        generateSecretString: {
          excludePunctuation: true,
          passwordLength: 32,
        },
      },
    );

    this.api = new apigw.RestApi(this, "DevApi", {
      restApiName: "dev-url-shortener",
    });

    this.api.root
      .addResource("shorten")
      .addMethod("POST", new apigw.LambdaIntegration(props.createFn));

    this.api.root
      .addResource("{urlCode}")
      .addMethod("GET", new apigw.LambdaIntegration(props.redirectFn));

    const webAcl = new wafv2.CfnWebACL(this, "ApiGwWebACL", {
      scope: "REGIONAL",
      defaultAction: { block: {} },
      rules: [
        {
          name: "AllowCloudFrontOriginVerify",
          priority: 1,
          action: { allow: {} },
          statement: {
            byteMatchStatement: {
              searchString:
                this.originVerifySecret.secretValue.unsafeUnwrap(),
              fieldToMatch: {
                singleHeader: { name: "x-origin-verify" },
              },
              textTransformations: [{ priority: 0, type: "NONE" }],
              positionalConstraint: "EXACTLY",
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "AllowCloudFrontOriginVerify",
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "ApiGwWebACL",
      },
    });

    const assoc = new wafv2.CfnWebACLAssociation(
      this,
      "ApiGwWebACLAssociation",
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${this.api.restApiId}/stages/${this.api.deploymentStage.stageName}`,
        webAclArn: webAcl.attrArn,
      },
    );
    assoc.node.addDependency(this.api.deploymentStage);
  }
}
