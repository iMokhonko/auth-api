locals {
  sign_up_lambda_name = "${var.env}-${var.feature}-${var.config.subdomain}-sign-up"
}

# Create iam role
resource "aws_iam_role" "sign_up_lambda_exec" {
  name = local.sign_up_lambda_name

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
resource "aws_lambda_function" "sign_up_lambda" {
  function_name = local.sign_up_lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.sign_up_lambda_exec.arn

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "sign_up_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${var.config.subdomain}/${local.sign_up_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "sign_up_lambda_policy" {
  statement {
    effect  = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem"
    ]

    resources = [var.context.database.dynamodb_table_arn]
  }
  
  statement {
    effect  = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "sign_up_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-sign-up-endpoint"
  description = "Allow /sign-up to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.sign_up_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "sign_up_lambda_policy" {
  role       = aws_iam_role.sign_up_lambda_exec.name
  policy_arn = aws_iam_policy.sign_up_policy.arn
}
