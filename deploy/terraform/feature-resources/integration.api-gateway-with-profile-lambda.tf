# create api integration with lambda
resource "aws_apigatewayv2_integration" "profile_lambda" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  integration_uri = aws_lambda_function.profile_lambda.invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "get_profile" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  route_key = "GET /profile/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.profile_lambda.id}"

  authorization_type = "CUSTOM"
  authorizer_id = aws_apigatewayv2_authorizer.authorizer.id
}

resource "aws_lambda_permission" "profile_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.profile_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}