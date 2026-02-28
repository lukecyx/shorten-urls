#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import {
  ApiGwStack,
  CacheStack,
  DbStack,
  LambdaStack,
  NetworkStack,
  RedisSecretStack,
  ReverseProxyStack,
} from "../infra/stacks";

const app = new cdk.App();
const stage = app.node.tryGetContext("stage") ?? "dev";
console.log("ACC_ID", process.env.CDK_DEFAULT_ACCOUNT);

if (stage === "dev") {
  const network = new NetworkStack(app, `NetworkStack-${stage}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });

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

  const redis = new CacheStack(app, `CacheStack-${stage}`, {
    stage,
    vpc: network.vpc,
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

  const lambdas = new LambdaStack(app, `LambdaStack-${stage}`, {
    vpc: network.vpc,
    dbSecurityGroup: postgres.securityGroup,
    redisSecurityGroup: redis.securityGroup,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });

  const apiGw = new ApiGwStack(app, `ApiGwStack-${stage}`, {
    createFn: lambdas.createFn,
    redirectFn: lambdas.redirectFn,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });

  new ReverseProxyStack(app, `ReverseProxyStack-${stage}`, {
    api: apiGw.api,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: "eu-west-2",
    },
  });
}
