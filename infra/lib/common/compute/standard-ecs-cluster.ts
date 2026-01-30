import { Cluster, ContainerInsights } from "aws-cdk-lib/aws-ecs";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export interface StandardEcsClusterProps {
  clusterName: string;
  vpc: IVpc;
}

export class StandardEcsCluster extends Construct {
  public ecs: Cluster;

  constructor(scope: Construct, id: string, props: StandardEcsClusterProps) {
    super(scope, id);

    this.createEcsCluster("Ecs_Cluster", props.clusterName, props.vpc);
  }

  private createEcsCluster(id: string, clusterName: string, vpc: IVpc) {
    this.ecs = new Cluster(this, id, {
      clusterName: clusterName,
      vpc: vpc,
      enableFargateCapacityProviders: true,
      containerInsightsV2: ContainerInsights.ENHANCED,
    });
  }
}
