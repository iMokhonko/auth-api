# create api integration with lambda
resource "aws_apigatewayv2_integration" "sign_up_lambda" {
  api_id = var.api_gw_id

  integration_uri = var.sign_up_lambda_invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "get_sign_up" {
  api_id = var.api_gw_id

  route_key = "GET /sign-up"
  target    = "integrations/${aws_apigatewayv2_integration.sign_up_lambda.id}"
}

resource "aws_lambda_permission" "sign_up_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.sign_up_lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${var.api_gw_execution_arn}/*/*"
}