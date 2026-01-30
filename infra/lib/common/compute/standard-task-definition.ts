import {
  FargateTaskDefinition,
  CpuArchitecture,
  OperatingSystemFamily,
  ContainerImage,
} from "aws-cdk-lib/aws-ecs";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export interface StandardFargateTaskDefinitionProps {
  family: string;
  ecrRepo: IRepository;
  imageTag?: string;
}

export class StandardFargateTaskDefinition extends Construct {
  private fargateTaskDef: FargateTaskDefinition;

  constructor(
    scope: Construct,
    id: string,
    props: StandardFargateTaskDefinitionProps,
  ) {
    super(scope, id);

    this.createTaskDef("Fargate_Task_Def", props.family);

    let image = ContainerImage.fromEcrRepository(props.ecrRepo, props.imageTag);
    this.addContainer("app", image);
  }

  private createTaskDef(id: string, family: string) {
    this.fargateTaskDef = new FargateTaskDefinition(this, id, {
      cpu: 256,
      enableFaultInjection: false,
      family: family,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.X86_64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
    });
  }

  private addContainer(id: string, image: ContainerImage) {
    this.fargateTaskDef.addContainer(id, {
      image: image,
    });
  }
}
