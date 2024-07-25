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

output "secretsManager" {
  value = {
    secretName = "${var.env}/${var.config.subdomain}/auth-api-jwt-secret"
    secretId   = aws_secretsmanager_secret.jwt_secret.id
    secretArn  = aws_secretsmanager_secret.jwt_secret.arn
  }
}

output "vpc" {
  value = {
    id = aws_vpc.auth_api_backend_vpc.id

    publicSubnetA = aws_subnet.auth_api_public_subnet_a.id,
    publicSubnetB = aws_subnet.auth_api_public_subnet_b.id

    privateSubnetA = aws_subnet.auth_api_private_subnet_a.id
    privateSubnetB = aws_subnet.auth_api_private_subnet_b.id
  }
}
