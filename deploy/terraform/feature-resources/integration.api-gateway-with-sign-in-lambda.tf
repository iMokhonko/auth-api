# create api integration with lambda
resource "aws_apigatewayv2_integration" "sign_in_lambda" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  integration_uri = aws_lambda_function.sign_in_lambda.invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "get_sign_in" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  route_key = "GET /sign-in"
  target    = "integrations/${aws_apigatewayv2_integration.sign_in_lambda.id}"
}

resource "aws_apigatewayv2_route" "post_sign_in" {
  api_id = aws_apigatewayv2_api.api_gateway.id

  route_key = "POST /sign-in"
  target    = "integrations/${aws_apigatewayv2_integration.sign_in_lambda.id}"
}

resource "aws_lambda_permission" "sign_in_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name =  aws_lambda_function.sign_in_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/*/*"
}