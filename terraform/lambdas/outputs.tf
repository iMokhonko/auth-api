output "sign_up_lambda_invoke_arn" {
  value = aws_lambda_function.sign_up_lambda.invoke_arn
}

output "sign_up_lambda_function_name" {
  value = aws_lambda_function.sign_up_lambda.function_name
}

output "sign_in_lambda_invoke_arn" {
  value = aws_lambda_function.sign_in_lambda.invoke_arn
}

output "sign_in_lambda_role_arn" {
  value = aws_iam_role.sign_in_lambda_exec.arn
}

output "sign_in_lambda_function_name" {
  value = aws_lambda_function.sign_in_lambda.function_name
}

output "handle_user_register_function_name" {
  value = aws_lambda_function.handle_user_register_lambda.function_name
}


# verify endpoint
output "verify_lambda_invoke_arn" {
  value = aws_lambda_function.verify_lambda.invoke_arn
}

output "verify_lambda_function_name" {
  value = aws_lambda_function.verify_lambda.function_name
}

# Authorizer lambda
output "authorizer_lambda_invoke_arn" {
  value = aws_lambda_function.authorizer_lambda.invoke_arn
}

output "authorizer_lambda_function_name" {
  value = aws_lambda_function.authorizer_lambda.function_name
}

output "authorizer_lambda_role_arn" {
  value = aws_iam_role.authorizer_lambda_exec.arn
}
# ---------
