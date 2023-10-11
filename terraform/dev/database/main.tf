terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/database.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name                        = "${var.env}-auth-api-users-table"
  hash_key                    = "login"
  table_class                 = "STANDARD"
  deletion_protection_enabled = true

  attributes = [
    {
      name = "login"
      type = "S"
    }
  ]

  tags = var.tags
}