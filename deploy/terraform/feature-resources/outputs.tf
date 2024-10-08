output "dynamodb" {
  value = {
    tableArn       = module.dynamodb_table.dynamodb_table_arn
    tableName      = "${var.env}-${var.feature}-auth-api"
    tableStreamArn = module.dynamodb_table.dynamodb_table_stream_arn
  }
}

output "lambdas" {
  value = {
    authorizer = {
      invokeArn    = aws_lambda_function.authorizer_lambda.invoke_arn
      functionName = aws_lambda_function.authorizer_lambda.function_name
      roleArn      = aws_iam_role.authorizer_lambda_exec.arn
    }

    profile = {
      invokeArn    = aws_lambda_function.profile_lambda.invoke_arn
      functionName = aws_lambda_function.profile_lambda.function_name
      roleArn      = aws_iam_role.profile_lambda_exec.arn
    }

    signIn = {
      invokeArn    = aws_lambda_function.sign_in_lambda.invoke_arn
      functionName = aws_lambda_function.sign_in_lambda.function_name
      roleArn      = aws_iam_role.sign_in_lambda_exec.arn
    }

    signUp = {
      invokeArn    = aws_lambda_function.sign_up_lambda.invoke_arn
      functionName = aws_lambda_function.sign_up_lambda.function_name
      roleArn      = aws_iam_role.sign_up_lambda_exec.arn
    }

    resetPassword = {
      invokeArn    = aws_lambda_function.reset_password_lambda.invoke_arn
      functionName = aws_lambda_function.reset_password_lambda.function_name
      roleArn      = aws_iam_role.reset_password_lambda_exec.arn
    }

    verifyUser = {
      invokeArn    = aws_lambda_function.verify_user_lambda.invoke_arn
      functionName = aws_lambda_function.verify_user_lambda.function_name
      roleArn      = aws_iam_role.verify_user_lambda_exec.arn
    }

    handleUserSignUp = {
      functionName = aws_lambda_function.handle_user_sign_up_lambda.function_name
    }
  }
}
