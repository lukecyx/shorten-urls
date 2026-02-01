import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface CacheStackProps extends cdk.StackProps {
  stage: string;
  vpc: ec2.Vpc;
}

export class CacheStack extends cdk.Stack {
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(this, "RedisSG", {
      vpc: props.vpc,
      description: `Redis security group for ${props.stage}`,
      allowAllOutbound: true,
    });

    const subnetGroup = new elasticache.CfnSubnetGroup(this, "SubnetGroup", {
      subnetIds: props.vpc.privateSubnets.map((s) => s.subnetId),
      description: `Subnet group for Redis ${props.stage}`,
      cacheSubnetGroupName: `redis-subnet-group-${props.stage}`,
    });

    const redisPassword = new secretsmanager.Secret(this, "RedisPassword", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "default" }),
        generateStringKey: "password",
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    const redisAuthToken = ssm.StringParameter.valueForStringParameter(
      this,
      `/${props.stage}/redis/auth-token`,
      1,
    );

    // Redis cluster (single-node, cheapest config)
    const redis = new elasticache.CfnReplicationGroup(this, "RedisCluster", {
      replicationGroupDescription: `Redis ${props.stage}`,
      engine: "redis",
      cacheNodeType: "cache.t4g.micro",
      numNodeGroups: 1,
      replicasPerNodeGroup: 0,
      automaticFailoverEnabled: false,
      cacheSubnetGroupName: subnetGroup.ref,
      securityGroupIds: [this.securityGroup.securityGroupId],
      authToken: redisAuthToken,
      replicationGroupId: `redis-${props.stage}`,
      transitEncryptionEnabled: true,
    });
  }
}
