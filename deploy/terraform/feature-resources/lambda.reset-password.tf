locals {
  reset_password_lambda_name = "${var.env}-${var.feature}-${var.config.subdomain}-reset-password"
}

# Create iam role
resource "aws_iam_role" "reset_password_lambda_exec" {
  name = local.reset_password_lambda_name

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
resource "aws_lambda_function" "reset_password_lambda" {
  function_name = local.reset_password_lambda_name

  runtime = "nodejs18.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.reset_password_lambda_exec.arn

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "reset_password_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.reset_password_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "reset_password_lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "ses:GetTemplate",
      "ses:SendEmail"
    ]

    resources = ["*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",            # for getting user by email
      "dynamodb:ConditionCheckItem", # condition check for checking token & user
      "dynamodb:PutItem",            # add change token
      "dynamodb:DeleteItem",         # remove change token
      "dynamodb:UpdateItem"          # update user password
    ]

    resources = [module.dynamodb_table.dynamodb_table_arn]
  }

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

resource "aws_iam_policy" "reset_password_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-reset-password"
  description = "Allow /reset-password to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.reset_password_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "reset_password_lambda_policy" {
  role       = aws_iam_role.reset_password_lambda_exec.name
  policy_arn = aws_iam_policy.reset_password_policy.arn
}

