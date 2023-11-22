locals {
  handle_user_register_lambda_name = "${var.env}-${var.feature}-${var.config.subdomain}-handle-user-register"
}

# Create iam role
resource "aws_iam_role" "handler_user_register_lambda_exec" {
  name = local.handle_user_register_lambda_name

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
resource "aws_lambda_function" "handle_user_register_lambda" {
  function_name = local.handle_user_register_lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.handler_user_register_lambda_exec.arn

  publish = true

  tags = var.tags

  depends_on = [ 
    aws_iam_role_policy_attachment.handle_user_register_lambda_policy,
    aws_cloudwatch_log_group.handle_user_register_lambda_cloudwatch_log_group 
  ]
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "handle_user_register_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.handle_user_register_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "handle_user_register_lambda_policy" {
  statement {
    effect  = "Allow"

    actions = [
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams"
    ]

    resources = [
      var.context.database.dynamo_db_table_stream_arn,
      var.context.database.dynamodb_table_arn
    ]
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

  statement {
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "handle_user_register_policy" {
  name        = "${var.env}-${var.feature}-${var.config.subdomain}-lambda-handler-user-register-endpoint"
  description = "Allow handle-user-register lambda to add logs to cloudwatch"
  policy      = data.aws_iam_policy_document.handle_user_register_lambda_policy.json
  
  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "handle_user_register_lambda_policy" {
  role       = aws_iam_role.handler_user_register_lambda_exec.name
  policy_arn = aws_iam_policy.handle_user_register_policy.arn
}