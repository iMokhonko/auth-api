locals {
  api_endpoint_url = replace(replace(replace(var.context.api_gw.api_endpoint_url, "https://", ""), "http://", ""), "wss://", "")
}

module "distribution" {
  source = "../../../terraform-modules/api_cloudfront_distribution"

  feature = var.feature
  dns_service_name = var.config.subdomain
  env = var.env
  hosted_zone =  var.config.hostedZone

  route53_zone_id = var.context.dns.route53_zone_id
  acm_master_certificate_arn = var.context.dns.acm_master_certificate_arn
  acm_features_certificate_arn = var.context.dns.acm_features_certificate_arn

  api_endpoint_url = local.api_endpoint_url
}