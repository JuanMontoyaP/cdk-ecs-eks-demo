.DEFAULT_GOAL:=help

# Docker Variables
DATE_TAG:=$(shell date +%Y%m%d)
GIT_SHA:=$(shell git rev-parse --short HEAD)
TAG_PREFIX:=dev
IMAGE_NAME=$(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com/ecs_ecr
IMAGE_TAG=$(TAG_PREFIX)-$(DATE_TAG)-$(GIT_SHA)

# AWS ENV Variables
AWS_REGION?=us-east-1
AWS_ACCOUNT:=$(shell aws sts get-caller-identity --query Account --output text)

.PHONY: help sync lock dev build push

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"} \
		/^[a-zA-Z0-9_-]+:.*##/ { \
			printf "\033[36m%-25s\033[0m %s\n", $$1, $$2 \
		}' $(MAKEFILE_LIST)

sync: ## Sync Dependencies on the environment
	uv sync

lock: ## Lock dependencies
	uv lock

dev: ## Run local server for development
	uv run uvicorn app.main:app --reload

sessions: ## Login into Amazon ECR
	aws ecr get-login-password \
    	--region $(AWS_REGION) | \
    	docker login \
    	--username AWS \
    	--password-stdin $(AWS_ACCOUNT).dkr.ecr.$(AWS_REGION).amazonaws.com

build: ## Build the Docker images
	docker build \
		--platform linux/amd64 \
		--provenance=false \
		--sbom=false \
		-t $(IMAGE_NAME):$(IMAGE_TAG) \
		-t $(IMAGE_NAME):latest \
		.

run-local: build ## Run the container in local
	docker run --rm -p 8000:80 $(IMAGE_NAME):$(IMAGE_TAG)

push: build ## Push the Docker image to ECR
	docker push \
		$(IMAGE_NAME) \
		--all-tags

# infra-plan: ## Terraform plan CLOUD=aws|gcp|azure|all
# 	@$(MAKE) -C infrastructure plan CLOUD=$(CLOUD)

# infra-apply: ## Terraform apply CLOUD=aws|gcp|azure|all
# 	@$(MAKE) -C infrastructure apply CLOUD=$(CLOUD)

# infra-output: ## Terraform output CLOUD=aws|gcp|azure|all
# 	@$(MAKE) -C infrastructure output CLOUD=$(CLOUD)

# infra-plan-destroy: ## Terraform plan -destroy CLOUD=aws|gcp|azure|all
# 	@$(MAKE) -C infrastructure plan-destroy CLOUD=$(CLOUD)

# infra-destroy: ## Terraform destroy CLOUD=aws|gcp|azure|all
# 	@$(MAKE) -C infrastructure destroy CLOUD=$(CLOUD)
