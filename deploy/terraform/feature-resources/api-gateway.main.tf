resource "aws_apigatewayv2_api" "api_gateway" {
  name          = "${var.env}-${var.feature}-auth-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["*"] # TODO change it to cloudfront distribution origin
    max_age       = 0
    allow_origins = ["*"]
    allow_headers = ["*"]
  }

  tags = var.tags
}

# Create stage
resource "aws_apigatewayv2_stage" "api_gateway_stage" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  name        = "master"
  auto_deploy = true

  stage_variables = {
    RATE_LIMIT_DEFAULT        = "10/minute"
    "RATE_LIMIT_POST_SIGN_IN" = "5/minute"
    "RATE_LIMIT_POST_SIGN_UP" = "1/hour"
  }

  tags = var.tags
}

# Create token authorizer
resource "aws_apigatewayv2_authorizer" "authorizer" {
  api_id                            = aws_apigatewayv2_api.api_gateway.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.authorizer_lambda.invoke_arn
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${var.env}-${var.feature}-auth-api-authorizer"
  authorizer_payload_format_version = "2.0"
  authorizer_result_ttl_in_seconds  = 0
}

# Create IP rate limiter authorizer
resource "aws_apigatewayv2_authorizer" "ip_rate_limiter_authorizer" {
  api_id                            = aws_apigatewayv2_api.api_gateway.id
  authorizer_type                   = "REQUEST"
  authorizer_uri                    = aws_lambda_function.ip_rate_limiter_lambda.invoke_arn
  name                              = "${var.env}-${var.feature}-auth-api-rate-limiter-authorizer"
  authorizer_payload_format_version = "2.0"
  authorizer_result_ttl_in_seconds  = 0
}
