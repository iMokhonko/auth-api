# Create api gateway
resource "aws_apigatewayv2_api" "api_gw" {
  name = "${var.env}-${var.feature}-${var.config.subdomain}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["*"] # TODO change it to cloudfront distribution origin
    max_age = 0
    allow_origins = ["*"]
    allow_headers = ["*"]
  }

  tags = var.tags
}
