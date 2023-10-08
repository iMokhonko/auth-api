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
  name  = "/${var.env}/${var.dns_service_name}"
  type  = "String"
  value = var.dns_address

  tags = {
    Env = var.env
  }
}