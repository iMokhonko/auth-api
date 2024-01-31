locals {
  verify_user_lambda_name = "${var.env}-${var.feature}-${var.config.subdomain}-verify-user"
}

# Create iam role
resource "aws_iam_role" "verify_user_lambda_exec" {
  name = local.verify_user_lambda_name

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
resource "aws_lambda_function" "verify_user_lambda" {
  function_name = local.verify_user_lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.verify_user_lambda_exec.arn

  publish = true

  tags = var.tags

  depends_on = [ 
    aws_iam_role_policy_attachment.verify_user_lambda_policy,
    aws_cloudwatch_log_group.verify_user_lambda_cloudwatch_log_group 
  ]
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "verify_user_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.verify_user_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "verify_user_lambda_policy" {
  statement {
    effect  = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem"
    ]

    resources = [module.dynamodb_table.dynamodb_table_arn]
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

resource "aws_iam_policy" "verify_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-verify-user"
  description = "Allow /verify lambda to add logs to cloudwatch and read/update items in dynamo db table"
  policy      = data.aws_iam_policy_document.verify_user_lambda_policy.json
  
  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "verify_user_lambda_policy" {
  role       = aws_iam_role.verify_user_lambda_exec.name
  policy_arn = aws_iam_policy.verify_policy.arn
}