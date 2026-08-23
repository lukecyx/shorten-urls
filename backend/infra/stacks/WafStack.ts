import * as cdk from "aws-cdk-lib";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

interface WafStackProps extends cdk.StackProps {
  stage: string;
}

export class WafStack extends cdk.Stack {
  public readonly waf: wafv2.CfnWebACL;
  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    this.waf = new wafv2.CfnWebACL(this, "WebWaf", {
      name: `WebWaf-${props.stage}`,
      description: `WAF rules for ${props.stage}`,
      defaultAction: {
        allow: {},
      },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `WebWaf-${props.stage}`,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `CommonRulset-${props.stage}`,
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `KnownBadInputs-${props.stage}`,
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWS-AWSManagedRulesSQLiRuleSet",
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: `AWSManagedRulesSQLiRuleSet-${props.stage}`,
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "SQLiRuleSet",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "RateLimit",
          action: { block: {} },
          priority: 4,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: "IP",
              limit: 100,
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `RateLimit-${props.stage}`,
            sampledRequestsEnabled: true,
          },
        },
      ],
    });
  }
}
