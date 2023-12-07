locals {
  api_endpoint_url = replace(replace(replace(var.context.api_gw.api_endpoint_url, "https://", ""), "http://", ""), "wss://", "")

  hasEnv = var.env != "prod"

  dns_record = "${var.feature == "master" ? "" : "${var.feature}."}${var.config.subdomain}${local.hasEnv ? ".${var.env}" : ""}"
}

# Create cache policy
resource "aws_cloudfront_origin_request_policy" "origin_request_policy" {
  name    = "${var.env}-${var.feature}-${var.config.subdomain}-origin-request-policy"
  comment = "Custom policy that forwards all query strings, all cookies, and the Token header"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = ["token"]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

# Create cloudfront distribution for API
resource "aws_cloudfront_distribution" "distribution" {
  origin {
    domain_name = local.api_endpoint_url
    origin_id   = "ApiGatewayOrigin"
    origin_path = "/master" 

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }
  
  enabled             = true
  comment             = "${local.dns_record} API distribution"
  default_root_object = ""

  aliases = ["${local.dns_record}.${var.config.hostedZone}"]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    target_origin_id       = "ApiGatewayOrigin"
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" // Managed-CachingDisabled policy ID
    origin_request_policy_id = aws_cloudfront_origin_request_policy.origin_request_policy.id
  }

  price_class = var.feature == "master" ? "PriceClass_All" : "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.feature == "master" ? var.context.dns.acm_master_certificate_arn : var.context.dns.acm_features_certificate_arn
    
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  wait_for_deployment = false

  tags = var.tags
}

# create distribution alias record for master feature
resource "aws_route53_record" "distribution_alias_record" {
  zone_id = var.context.dns.route53_zone_id
  name    = local.dns_record
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.distribution.domain_name
    zone_id                = aws_cloudfront_distribution.distribution.hosted_zone_id
    evaluate_target_health = false
  }
}