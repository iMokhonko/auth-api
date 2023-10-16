output "api_gw_id" {
  value = aws_apigatewayv2_api.api_gw.id
}

output "api_gw_execution_arn" {
  value = aws_apigatewayv2_api.api_gw.execution_arn
}

output "api_endpoint_url" {
  value = aws_apigatewayv2_api.api_gw.api_endpoint
}