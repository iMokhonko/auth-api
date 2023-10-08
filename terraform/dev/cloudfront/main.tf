terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/cloudfront_distribution.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

locals {
  api_endpoint_url = replace(replace(replace(var.api_endpoint_url, "https://", ""), "http://", ""), "wss://", "")
}

module "distribution" {
  source = "../../../terraform-modules/api_cloudfront_distribution"

  feature = var.feature
  dns_service_name = var.dns_service_name
  env = var.env
  hosted_zone = var.hosted_zone

  route53_zone_id = var.route53_zone_id
  acm_master_certificate_arn = var.acm_master_certificate_arn
  acm_features_certificate_arn = var.acm_features_certificate_arn

  api_endpoint_url = local.api_endpoint_url
}