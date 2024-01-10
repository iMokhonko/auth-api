locals {
  google_sign_in_lambda_name = "${var.env}-${var.feature}-${var.config.subdomain}-google-sign-in"
}

# Create iam role
resource "aws_iam_role" "google_sign_in_lambda_exec" {
  name = local.google_sign_in_lambda_name

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
resource "aws_lambda_function" "google_sign_in_lambda" {
  function_name = local.google_sign_in_lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.google_sign_in_lambda_exec.arn

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "google_sign_in_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.google_sign_in_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "google_sign_in_lambda_policy" {
  statement {
    effect  = "Allow"

    actions = ["dynamodb:GetItem"]

    resources = [var.context.database.dynamodb_table_arn]
  }
  
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

resource "aws_iam_policy" "google_sign_in_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-google-sign-in-endpoint"
  description = "Allow /google-sign-in to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.google_sign_in_lambda_policy.json
  
  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "google_sign_in_lambda_policy" {
  role       = aws_iam_role.google_sign_in_lambda_exec.name
  policy_arn = aws_iam_policy.google_sign_in_policy.arn
}
