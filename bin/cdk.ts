#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import {
  CacheStack,
  DbStack,
  LambdaStack,
  NetworkStack,
  RedisSecretStack,
} from "../infra/stacks";

const app = new cdk.App();
const stage = app.node.tryGetContext("stage") ?? "dev";
console.log("ACC_ID", process.env.CDK_DEFAULT_ACCOUNT);

if (stage === "dev") {
  // const redisSecretStack = new RedisSecretStack(
  //   app,
  //   `RedisSecretStack-${stage}`,
  //   {
  //     stage: "dev",
  //     env: {
  //       account: process.env.CDK_DEFAULT_ACCOUNT,
  //       region: "eu-west-2",
  //     },
  //   },
  // );

  const network = new NetworkStack(app, `NetworkStack-${stage}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });

  const postgres = new DbStack(app, `DbStack-${stage}`, {
    stage,
    vpc: network.vpc,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });

  const redis = new CacheStack(app, `CacheStack-${stage}`, {
    stage,
    vpc: network.vpc,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });

  const lambdas = new LambdaStack(app, `LambdaStack-${stage}`, {
    vpc: network.vpc,
    dbSecurityGroup: postgres.securityGroup,
    redisSecurityGroup: redis.securityGroup,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });
}
