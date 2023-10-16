# Create stage
resource "aws_apigatewayv2_stage" "api_stage" {
  api_id = var.context.api_gw.api_gw_id

  name = var.feature
  auto_deploy = true

  tags = var.tags
}