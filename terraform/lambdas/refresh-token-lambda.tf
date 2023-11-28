locals {
  refresh_token_lambda_name = "${var.env}-${var.feature}-${var.config.subdomain}-refresh-token"
}

# Create iam role
resource "aws_iam_role" "refresh_token_lambda_exec" {
  name = local.refresh_token_lambda_name

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
resource "aws_lambda_function" "refresh_token_lambda" {
  function_name = local.refresh_token_lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.refresh_token_lambda_exec.arn

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "refresh_token_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.refresh_token_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "refresh_token_lambda_policy" {
  statement {
    effect  = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "refresh_token_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-refresh-token-endpoint"
  description = "Allow /refresh-token to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.refresh_token_lambda_policy.json
  
  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "refresh_token_lambda_policy" {
  role       = aws_iam_role.refresh_token_lambda_exec.name
  policy_arn = aws_iam_policy.refresh_token_policy.arn
}

