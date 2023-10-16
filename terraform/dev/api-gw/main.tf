# Create api gateway
resource "aws_apigatewayv2_api" "api_gw" {
  name = "${var.env}/${var.feature}/auth"
  protocol_type = "HTTP"

  tags = var.tags
}
