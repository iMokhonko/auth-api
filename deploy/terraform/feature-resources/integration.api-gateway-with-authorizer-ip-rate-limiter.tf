# allow Api Gateway to call ip rate limiter authorizer lambda 
resource "aws_lambda_permission" "ip_rate_limiter_invoke_permissions" {
  statement_id_prefix = "AllowAuthorizerExecution"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.ip_rate_limiter_lambda.function_name
  principal           = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.ip_rate_limiter_authorizer.id}"
}
