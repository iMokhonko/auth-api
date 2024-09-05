locals {
  handle_user_sign_up_lambda_name = "${var.env}-${var.feature}-auth-api-handle-user-sign-up"
}

# Create iam role
resource "aws_iam_role" "handle_user_sign_up_lambda_exec" {
  name = local.handle_user_sign_up_lambda_name

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
resource "aws_lambda_function" "handle_user_sign_up_lambda" {
  function_name = local.handle_user_sign_up_lambda_name

  runtime = "nodejs18.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.handle_user_sign_up_lambda_exec.arn

  publish = true

  tags = var.tags

  depends_on = [
    aws_iam_role_policy_attachment.handle_user_sign_up_lambda_policy,
    aws_cloudwatch_log_group.handle_user_sign_up_lambda_cloudwatch_log_group
  ]
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "handle_user_sign_up_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.handle_user_sign_up_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "handle_user_sign_up_lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams"
    ]

    resources = [
      module.dynamodb_table.dynamodb_table_stream_arn,
      module.dynamodb_table.dynamodb_table_arn
    ]
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

  statement {
    actions = [
      "ses:GetTemplate",
      "ses:SendEmail"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "handle_user_sign_up_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-handler-user-sign-up"
  description = "Allow handle-user-sign-up lambda to add logs to cloudwatch"
  policy      = data.aws_iam_policy_document.handle_user_sign_up_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "handle_user_sign_up_lambda_policy" {
  role       = aws_iam_role.handle_user_sign_up_lambda_exec.name
  policy_arn = aws_iam_policy.handle_user_sign_up_policy.arn
}

# add
resource "aws_lambda_event_source_mapping" "handle_user_sign_up_integration" {
  event_source_arn  = module.dynamodb_table.dynamodb_table_stream_arn
  function_name     = aws_lambda_function.handle_user_sign_up_lambda.function_name
  starting_position = "TRIM_HORIZON"
}

