# Create API
resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${var.env}-${var.feature}-auth-api"
  protocol_type = "HTTP"

  disable_execute_api_endpoint = true

  cors_configuration {
    allow_methods = ["*"] # TODO change it to cloudfront distribution origin
    max_age       = 0
    allow_origins = [
      "https://auth.${var.env}.${var.config.hostedZone}",
      "http://localhost:5173"
    ]
    allow_headers  = ["*"]
    expose_headers = ["*"]
  }

  tags = var.tags
}

# Create stage
resource "aws_apigatewayv2_stage" "api_gateway_stage" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  name        = "master"
  auto_deploy = true

  tags = var.tags
}

# Create authorizer
resource "aws_apigatewayv2_authorizer" "authorizer" {
  api_id                            = aws_apigatewayv2_api.api_gateway.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer_lambda.invoke_arn
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${var.env}-${var.feature}-auth-api-authorizer"
  authorizer_payload_format_version = "2.0"
  authorizer_result_ttl_in_seconds  = 0
}

resource "aws_apigatewayv2_domain_name" "custom_domain_name" {
  domain_name = "${var.config.subdomain}.${var.env}.${var.config.hostedZone}"

  domain_name_configuration {
    certificate_arn = var.global_resources.tls_certificate.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "example" {
  api_id      = aws_apigatewayv2_api.api_gateway.id
  domain_name = aws_apigatewayv2_domain_name.custom_domain_name.id
  stage       = aws_apigatewayv2_stage.api_gateway_stage.id
}

resource "aws_route53_record" "api_route_53_record" {
  name    = aws_apigatewayv2_domain_name.custom_domain_name.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.primary.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.custom_domain_name.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.custom_domain_name.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}
