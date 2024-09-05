locals {
  authorizer_lambda_name = "${var.env}-${var.feature}-auth-api-authorizer"
}

# Create iam role
resource "aws_iam_role" "authorizer_lambda_exec" {
  name = local.authorizer_lambda_name

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY

  tags = var.tags
}


# Create lambda function
resource "aws_lambda_function" "authorizer_lambda" {
  function_name = local.authorizer_lambda_name

  runtime = "nodejs18.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.authorizer_lambda_exec.arn

  environment {
    variables = {
      JWT_SECRET = data.aws_ssm_parameter.jwt_secret.value
    }
  }

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "authorizer_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.authorizer_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "authorizer_lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "authorizer_policy" {
  name        = "${var.env}-${var.feature}-auth-api-lambda-authorizer"
  description = "Authorizer for API endpoints"
  policy      = data.aws_iam_policy_document.authorizer_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "authorizer_lambda_policy" {
  role       = aws_iam_role.authorizer_lambda_exec.name
  policy_arn = aws_iam_policy.authorizer_policy.arn
}


# allow Api Gateway to call this authorizer lambda 
resource "aws_lambda_permission" "authorizer_invoke_permissions" {
  statement_id_prefix = "AllowAuthorizerExecution"
  action              = "lambda:InvokeFunction"
  function_name       = aws_lambda_function.authorizer_lambda.function_name
  principal           = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.rest_api.execution_arn}/authorizers/*"
}
