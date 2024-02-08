# create api integration with lambda
resource "aws_apigatewayv2_integration" "reset_password_lambda" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  integration_uri = aws_lambda_function.reset_password_lambda.invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "post_reset_password" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  route_key = "POST /reset-password"
  target    = "integrations/${aws_apigatewayv2_integration.reset_password_lambda.id}"
}

resource "aws_lambda_permission" "reset_password_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reset_password_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}