# create api integration with lambda
resource "aws_apigatewayv2_integration" "google_sign_in_lambda" {
  api_id = var.context.api_gw.api_gw_id

  integration_uri = var.context.lambdas.google_sign_in_lambda_invoke_arn
  integration_type = "AWS_PROXY"
  integration_method = "POST"
}

# create GET route
resource "aws_apigatewayv2_route" "get_google_sign_in" {
  api_id = var.context.api_gw.api_gw_id

  route_key = "POST /auth/google"
  target    = "integrations/${aws_apigatewayv2_integration.google_sign_in_lambda.id}"
}

resource "aws_lambda_permission" "google_sign_in_invoke_permissions" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.context.lambdas.google_sign_in_lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${var.context.api_gw.api_gw_execution_arn}/*/*"
}