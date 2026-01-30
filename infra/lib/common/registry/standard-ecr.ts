import {
  TagStatus,
  Repository,
  LifecycleRule,
  TagMutability,
  ImageTagMutabilityExclusionFilter,
} from "aws-cdk-lib/aws-ecr";
import { RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface StandardEcrProps {
  repositoryName: string;
  prodTag: string;
  devTag: string;
}

export class StandardEcr extends Construct {
  public ecr: Repository;

  constructor(scope: Construct, id: string, props: StandardEcrProps) {
    super(scope, id);

    const exclusionFilters = this.getExclusionFilters([
      `${props.devTag}*`,
      props.prodTag,
    ]);

    this.createEcrRepository(id, props.repositoryName, exclusionFilters);
    this.addLifeCycleRules(props.prodTag, props.devTag);
  }

  createEcrRepository(
    id: string,
    repositoryName: string,
    exclusionFilters: ImageTagMutabilityExclusionFilter[],
  ) {
    this.ecr = new Repository(this, id, {
      repositoryName: repositoryName,
      imageScanOnPush: true,
      emptyOnDelete: true,
      imageTagMutability: TagMutability.IMMUTABLE_WITH_EXCLUSION,
      imageTagMutabilityExclusionFilters: exclusionFilters,
      removalPolicy: RemovalPolicy.DESTROY,
    });
  }

  getExclusionFilters(
    mutableTags: string[] = [],
  ): ImageTagMutabilityExclusionFilter[] {
    return mutableTags.map((tag) =>
      ImageTagMutabilityExclusionFilter.wildcard(tag),
    );
  }

  addLifeCycleRules(prodTag: string, devTag: string) {
    this.ecr.addLifecycleRule({
      tagPrefixList: [prodTag],
      maxImageCount: 1,
      rulePriority: 1,
      description: "Only one image with latest tag",
    });

    this.ecr.addLifecycleRule({
      tagPrefixList: [devTag],
      maxImageCount: 5,
      rulePriority: 2,
      description: "Max 5 dev images, up to 30 days old",
    });

    this.ecr.addLifecycleRule({
      tagStatus: TagStatus.UNTAGGED,
      rulePriority: 3,
      maxImageAge: Duration.days(1),
      description: "No images untagged",
    });

    this.ecr.addLifecycleRule({
      maxImageAge: Duration.days(30),
      rulePriority: 4,
      description: "Expire images older than 30 days",
    });
  }
}
