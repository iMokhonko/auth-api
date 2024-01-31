locals {
  api_endpoint_url = replace(replace(replace(aws_apigatewayv2_api.api_gateway.api_endpoint, "https://", ""), "http://", ""), "wss://", "")
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
    response_headers_policy_id = "60669652-455b-4ae9-85a4-c4c02393f86c" // Managed reponse headers policy

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.cors_headers.arn
    }
  }

  price_class = var.feature == "master" ? "PriceClass_All" : "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.feature == "master" ? var.global_resources.dns.acmMasterCertificateArn : var.global_resources.dns.acmFeaturesCertificateArn
    
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  wait_for_deployment = false

  tags = var.tags
}

# create distribution alias record for master feature
resource "aws_route53_record" "distribution_alias_record" {
  zone_id = var.global_resources.dns.route53ZoneId
  name    = local.dns_record
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.distribution.domain_name
    zone_id                = aws_cloudfront_distribution.distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_cloudfront_function" "cors_headers" {
  name    = "${var.env}-${var.config.subdomain}-subdomain-cors"
  runtime = "cloudfront-js-2.0"
  comment = "Adds CORS headers for env subdomains"
  publish = true
  code    = <<-EOF
function handler(event) {
  var request = event.request;
  var response = event.response;
  var headers = response.headers;

  var requesterOrigin = request.headers.origin ? request.headers.origin.value : '';

  var originSuffix = "${local.hasEnv ? ".${var.env}" : ""}.${var.config.hostedZone}";
  var originSuffixLength = originSuffix.length;
  var requesterOriginSuffix = requesterOrigin.substring(requesterOrigin.length - originSuffixLength);

  if (requesterOriginSuffix.toLowerCase() === originSuffix) {
    headers['access-control-allow-origin'] = { value: requesterOrigin };
    headers['access-control-allow-headers'] = { value: 'Authorization' }; 
    headers['access-control-allow-methods'] = { value: '*' }; 
  }

  return response;
}
EOF
}