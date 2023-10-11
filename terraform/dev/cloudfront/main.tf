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
  api_endpoint_url = replace(replace(replace(var.context.api_gw.api_endpoint_url, "https://", ""), "http://", ""), "wss://", "")
}

module "distribution" {
  source = "../../../terraform-modules/api_cloudfront_distribution"

  feature = var.feature
  dns_service_name = "auth-api"
  env = var.env
  hosted_zone = "imokhonko.com"

  route53_zone_id = var.context.dns.route53_zone_id
  acm_master_certificate_arn = var.context.dns.acm_master_certificate_arn
  acm_features_certificate_arn = var.context.dns.acm_features_certificate_arn

  api_endpoint_url = local.api_endpoint_url
}