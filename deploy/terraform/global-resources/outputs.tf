output "s3" {
  value = {
    bucketId = aws_s3_bucket.lambdas_bucket.id
  }
}

output "dns" {
  value = {
    route53ZoneId             = module.route_53_subdomain.route53_zone_id
    acmMasterCertificateArn   = module.route_53_subdomain.acm_master_certificate_arn
    acmFeaturesCertificateArn = module.route_53_subdomain.acm_features_certificate_arn
    dnsAddress                = module.route_53_subdomain.dns_address
  }
}
