# Create TLS certificate in default region
resource "aws_acm_certificate" "tls_certificate" {
  domain_name       = "${var.config.subdomain}.${var.env}.${var.config.hostedZone}"
  validation_method = "DNS"
  tags              = var.tags

  provider = aws.us_east_1
}

# Add validation records for TLS certificate in default region
resource "aws_route53_record" "tls_certificate_validation_record" {
  for_each = {
    for dvo in aws_acm_certificate.tls_certificate.domain_validation_options : dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
      zone_id = data.aws_route53_zone.primary.id
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.primary.id

  depends_on = [aws_acm_certificate.tls_certificate]

  provider = aws.us_east_1
}

# wait for certificate validation
resource "aws_acm_certificate_validation" "tls_validation" {
  certificate_arn         = aws_acm_certificate.tls_certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.tls_certificate_validation_record : record.fqdn]

  depends_on = [aws_route53_record.tls_certificate_validation_record]

  provider = aws.us_east_1
}
