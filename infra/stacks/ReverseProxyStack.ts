import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { RestApiOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { RestApi } from "aws-cdk-lib/aws-apigateway";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface ReverseProxyStackProps extends cdk.StackProps {
  api: RestApi;
  originVerifySecretName: string;
  webAclId: string;
}

export class ReverseProxyStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: ReverseProxyStackProps) {
    super(scope, id, props);

    const originVerifySecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "OriginVerifySecret",
      props.originVerifySecretName,
    );

    const traceparentFn = new cloudfront.Function(this, "TraceparentFunction", {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromFile({
        filePath: "./infra/cloudfront-functions/traceparent.js",
      }),
    });

    const traceparentPolicy = new cloudfront.OriginRequestPolicy(
      this,
      "TraceparentPolicy",
      {
        headerBehavior:
          cloudfront.OriginRequestHeaderBehavior.allowList("traceparent"),
      },
    );

    this.distribution = new cloudfront.Distribution(
      this,
      "ReverseProxyDistribution",
      {
        webAclId: props.webAclId,
        defaultBehavior: {
          origin: new RestApiOrigin(props.api, {
            customHeaders: {
              "x-origin-verify": originVerifySecret.secretValue.toString(),
            },
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: traceparentPolicy,
          functionAssociations: [
            {
              function: traceparentFn,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        enableLogging: true,
      },
    );

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
    });
  }
}
