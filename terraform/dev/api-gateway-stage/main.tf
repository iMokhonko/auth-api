terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/api-gw-stage.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

# Create stage
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id = var.api_gateway_id

  name = var.feature
  auto_deploy = true
}