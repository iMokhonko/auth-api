# Create authorizer
resource "aws_apigatewayv2_authorizer" "authorizer" {
  api_id           = aws_apigatewayv2_api.api_gw.id
  authorizer_type  = "REQUEST"
  authorizer_uri   = var.context.lambdas.authorizer_lambda_invoke_arn
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.env}-${var.feature}-${var.config.subdomain}-authorizer"
  authorizer_payload_format_version = "2.0"
  authorizer_result_ttl_in_seconds = 0
}