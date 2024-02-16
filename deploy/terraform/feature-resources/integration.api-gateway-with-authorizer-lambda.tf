# allow Api Gateway to call this authorizer lambda 
resource "aws_lambda_permission" "authorizer_invoke_permissions" {
  statement_id_prefix  = "AllowAuthorizerExecution"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.api_gateway.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.authorizer.id}"
}