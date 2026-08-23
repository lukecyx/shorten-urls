import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";

interface MessageStackProps extends cdk.StackProps {}

export class MessagingStack extends cdk.Stack {
  public readonly urlAnalyticsQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: MessageStackProps) {
    super(scope, id, props);

    this.urlAnalyticsQueue = new sqs.Queue(this, "UrlAnalyticsQueue", {
      queueName: "url-analytics-queue",
    });
  }
}
