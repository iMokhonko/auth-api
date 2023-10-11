locals {
  sign_in_lambda_name = "${var.env}-${var.feature}-sign-in"

  sign_in_lambda_tags = {
    Service = "auth-api"
    Env = var.env
    Feature = var.feature
  }
}

# Create iam role
resource "aws_iam_role" "sign_in_lambda_exec" {
  name = local.sign_in_lambda_name

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

  tags = local.sign_in_lambda_tags
}

# Create lambda function
resource "aws_lambda_function" "sign_in_lambda" {
  function_name = local.sign_in_lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  s3_bucket = var.s3_bucket_id
  s3_key    = "${var.env}/${var.feature}/sign-in-lambda.zip"

  # source_code_hash = data.archive_file.sign_in_lambda.output_base64sha512

  role = aws_iam_role.sign_in_lambda_exec.arn

  tags = local.sign_in_lambda_tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "sign_in_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/auth-api/${local.sign_in_lambda_name}"

  retention_in_days = 14

  tags = local.sign_in_lambda_tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "sign_in_lambda_policy" {
  statement {
    effect  = "Allow"

    actions = [
      "dynamodb:GetItem"
    ]

    resources = [var.dynamodb_table_arn]
  }
  
  statement {
    effect  = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
      effect  = "Allow"

      actions = [
        "secretsmanager:GetSecretValue"
      ]

      resources = [var.secret_arn]
  }
}

resource "aws_iam_policy" "sign_in_policy" {
  name        = "${var.env}-auth-api-lambda-sign-in-endpoint"
  description = "Allow /sign-in to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.sign_in_lambda_policy.json
  
  tags = local.sign_in_lambda_tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "sign_in_lambda_policy" {
  role       = aws_iam_role.sign_in_lambda_exec.name
  policy_arn = aws_iam_policy.sign_in_policy.arn
}

