import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export interface DbStackProps extends cdk.StackProps {
  stage: string;
  vpc: ec2.Vpc;
}

export class DbStack extends cdk.Stack {
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly dbSecret: ISecret;

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(this, "PostgresSG", {
      vpc: props.vpc,
    });

    const db = new rds.DatabaseCluster(this, "Postgres", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_17_7,
      }),
      vpc: props.vpc,
      // Stores a random password in secrets manager.
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      writer: rds.ClusterInstance.provisioned("Writer", {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE4_GRAVITON,
          ec2.InstanceSize.MEDIUM,
        ),
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned("Reader", {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE4_GRAVITON,
            ec2.InstanceSize.MEDIUM,
          ),
          publiclyAccessible: false,
        }),
      ],
      securityGroups: [this.securityGroup],
      defaultDatabaseName: process.env.DB_NAME,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const secret = db.secret!;
    this.dbSecret = secret;

    new ssm.StringParameter(this, "DbConnectionDev", {
      parameterName: "/db/connectionJSON",
      stringValue: JSON.stringify({
        host: db.clusterEndpoint.hostname,
        port: db.clusterEndpoint.port,
        username: secret.secretValueFromJson("username").toString(),
        database: process.env.DB_NAME,
      }),
      dataType: ssm.ParameterDataType.TEXT,
    });
  }
}
