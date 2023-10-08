terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/api-gw.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

# Create api gateway
resource "aws_apigatewayv2_api" "api_gw" {
  name = "${var.env}/auth"
  protocol_type = "HTTP"
}
