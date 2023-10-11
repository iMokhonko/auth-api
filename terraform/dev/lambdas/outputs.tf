output "sign_up_lambda_invoke_arn" {
  value = aws_lambda_function.sign_up_lambda.invoke_arn
}

output "sign_up_lambda_function_name" {
  value = aws_lambda_function.sign_up_lambda.function_name
}

output "sign_in_lambda_invoke_arn" {
  value = aws_lambda_function.sign_in_lambda.invoke_arn
}

output "sign_in_lambda_function_name" {
  value = aws_lambda_function.sign_in_lambda.function_name
}