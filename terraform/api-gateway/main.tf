# Create api gateway
resource "aws_apigatewayv2_api" "api_gw" {
  name = "${var.env}-${var.feature}-${var.config.subdomain}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_methods = ["*"]
    max_age = 60

    # for prod env allow only one subdomain (Auth UI), for other envs for all origins
    # allow_origins = var.env == "prod" ? ["https://auth.${var.config.hostedZone}"] : ["*"]
    allow_origins = ["*"]
  }

  tags = var.tags
}
