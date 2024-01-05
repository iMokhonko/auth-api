# allow Api Gateway to call this authorizer lambda 
resource "aws_lambda_permission" "authorizer_invoke_permissions" {
  statement_id_prefix  = "AllowAuthorizerExecution"
  action        = "lambda:InvokeFunction"
  function_name = var.context.lambdas.authorizer_lambda_function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${var.context.api_gw.api_gw_execution_arn}/authorizers/${var.context.api_gw.api_gw_authorizer_id}"
}