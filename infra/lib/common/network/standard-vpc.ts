import {
  Vpc,
  IpAddresses,
  IIpAddresses,
  SubnetType,
  FlowLogDestination,
} from "aws-cdk-lib/aws-ec2";
import { Tags } from "aws-cdk-lib/core";
import { Construct } from "constructs";

import { StandardLogGroup } from "../monitoring/standard-log-group";

export interface StandardVpcProps {
  cidr: string;
  tag: string;
  maxAzs?: number;
  logGroupName: string;
  retention?: number;
}

export class StandardVpc extends Construct {
  public vpc: Vpc;
  private vpcLogGroup: StandardLogGroup;

  constructor(scope: Construct, id: string, props: StandardVpcProps) {
    super(scope, id);

    this.createVpc("Vpc", IpAddresses.cidr(props.cidr), props.maxAzs);

    this.vpcLogGroup = new StandardLogGroup(this, "FlowLogs", {
      logGroupName: props.logGroupName,
      retention: props.retention,
    });

    this.vpc.addFlowLog("FlowLogs", {
      destination: FlowLogDestination.toCloudWatchLogs(
        this.vpcLogGroup.logGroup,
      ),
    });

    Tags.of(this).add("VPC", props.tag);
  }

  private createVpc(id: string, cidr: IIpAddresses, maxAzs: number = 2) {
    this.vpc = new Vpc(this, id, {
      ipAddresses: cidr,
      maxAzs: maxAzs,
      createInternetGateway: true,
      natGateways: 1,
      restrictDefaultSecurityGroup: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "PublicSubnet",
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 24,
          name: "PrivateSubnet",
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
  }
}
