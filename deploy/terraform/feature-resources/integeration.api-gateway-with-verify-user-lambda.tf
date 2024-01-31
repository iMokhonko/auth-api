# create api integration with lambda
resource "aws_apigatewayv2_integration" "verify_user_lambda" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  integration_uri = aws_lambda_function.verify_user_lambda.invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "get_verify_user" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  route_key = "GET /verify"
  target    = "integrations/${aws_apigatewayv2_integration.verify_user_lambda.id}"
}

resource "aws_lambda_permission" "verify_user_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.verify_user_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}