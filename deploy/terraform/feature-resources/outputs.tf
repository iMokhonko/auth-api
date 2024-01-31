output "dynamodb" {
  value = {
    tableArn = module.dynamodb_table.dynamodb_table_arn
    tableName = "${var.env}-${var.feature}-${var.config.subdomain}"
    tableStreamArn = module.dynamodb_table.dynamodb_table_stream_arn
  }
}

output "lambdas" {
  value = {
    authorizer = {
      invokeArn = aws_lambda_function.authorizer_lambda.invoke_arn
      functionName = aws_lambda_function.authorizer_lambda.function_name
      roleArn = aws_iam_role.authorizer_lambda_exec.arn
    }

    signIn = {
      invokeArn = aws_lambda_function.sign_in_lambda.invoke_arn
      functionName = aws_lambda_function.sign_in_lambda.function_name
      roleArn = aws_iam_role.sign_in_lambda_exec.arn
    }

    signUp = {
      invokeArn = aws_lambda_function.sign_up_lambda.invoke_arn
      functionName = aws_lambda_function.sign_up_lambda.function_name
      roleArn = aws_iam_role.sign_up_lambda_exec.arn
    }

    verifyUser = {
      invokeArn = aws_lambda_function.verify_user_lambda.invoke_arn
      functionName = aws_lambda_function.verify_user_lambda.function_name
      roleArn = aws_iam_role.verify_user_lambda_exec.arn
    }

    handleUserSignUp = {
      functionName = aws_lambda_function.handle_user_sign_up_lambda.function_name
    }
  }
}

output "apiGateway" {
  value = {
    id = aws_apigatewayv2_api.api_gateway.id
    executionArn = aws_apigatewayv2_api.api_gateway.execution_arn
    endpointUrl = aws_apigatewayv2_api.api_gateway.api_endpoint
    authorizerId = aws_apigatewayv2_authorizer.authorizer.id
  }
}

output "cloudfront" {
  value = {
    distributionId = aws_cloudfront_distribution.distribution.id
  }
}