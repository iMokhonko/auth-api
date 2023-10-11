terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/config.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

resource "aws_ssm_parameter" "config" {
  name  = "/${var.env}/auth-api"
  type  = "String"
  value = var.context.dns.dns_address

  tags = var.tags
}