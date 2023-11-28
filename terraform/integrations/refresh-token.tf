# create api integration with lambda
resource "aws_apigatewayv2_integration" "refresh_token_lambda" {
  api_id = var.context.api_gw.api_gw_id

  integration_uri = var.context.lambdas.refresh_token_lambda_invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "get_refresh_token" {
  api_id = var.context.api_gw.api_gw_id

  route_key = "POST /refresh-token"
  target    = "integrations/${aws_apigatewayv2_integration.refresh_token_lambda.id}"
}

resource "aws_lambda_permission" "refresh_token_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.context.lambdas.refresh_token_lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${var.context.api_gw.api_gw_execution_arn}/*/*"
}