import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ssm from "aws-cdk-lib/aws-ssm";

export interface DbStackProps extends cdk.StackProps {
  stage: string;
  vpc: ec2.Vpc;
}

export class DbStack extends cdk.Stack {
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(this, "PostgresSG", {
      vpc: props.vpc,
    });

    const db = new rds.DatabaseInstance(this, "Postgres", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      vpc: props.vpc,
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      multiAz: true,
      allocatedStorage: 20,
      publiclyAccessible: false,
      securityGroups: [this.securityGroup],
      databaseName: process.env.DB_NAME,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const secret = db.secret!;

    new ssm.StringParameter(this, "DbConnectionDev", {
      parameterName: "/db/connectionJSON",
      stringValue: JSON.stringify({
        host: db.dbInstanceEndpointAddress,
        port: db.dbInstanceEndpointPort,
        username: secret.secretValueFromJson("username").toString(),
        database: process.env.DB_NAME,
      }),
      dataType: ssm.ParameterDataType.TEXT,
    });
  }
}
