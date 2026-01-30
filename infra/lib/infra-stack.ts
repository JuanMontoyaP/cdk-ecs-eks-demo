import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { StandardVpc } from "./common/network/standard-vpc";
import { StandardEcr } from "./common/registry/standard-ecr";
import { StandardEcsCluster } from "./common/compute/standard-ecs-cluster";
import { StandardFargateTaskDefinition } from "./common/compute/standard-task-definition";

export class InfraStack extends cdk.Stack {
  private readonly vpc: StandardVpc;
  private readonly ecr: StandardEcr;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.ecr = new StandardEcr(this, "ECS_Ecr", {
      repositoryName: "ecs_ecr",
      devTag: "dev-",
      prodTag: "latest",
    });

    this.vpc = new StandardVpc(this, "ECS_Vpc", {
      cidr: "10.0.0.0/16",
      tag: "ECS VPC",
      logGroupName: "/vpc/VpcFlowLogs",
    });

    new StandardEcsCluster(this, "ECS_Cluster", {
      clusterName: "ECR_Cluster_Demo",
      vpc: this.vpc.vpc,
    });

    new StandardFargateTaskDefinition(this, "FargateTaskDef", {
      family: "Task-app",
      ecrRepo: this.ecr.ecr,
    });
  }
}
