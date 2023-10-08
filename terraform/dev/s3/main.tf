terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/s3.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

# Create s3 bucket for lambda function zip archive
resource "aws_s3_bucket" "lambdas_bucket" {
  bucket_prefix = "${var.env}.auth-api-lambdas-"
  force_destroy = true
}

# Create policy for access control for lambda code bucket
resource "aws_s3_bucket_public_access_block" "lambdas_bucket" {
  bucket = aws_s3_bucket.lambdas_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
