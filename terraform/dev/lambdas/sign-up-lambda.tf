locals {
  lambda_name = "${var.env}-${var.feature}-sign-up"
}

# Create iam role
resource "aws_iam_role" "sign_up_lambda_exec" {
  name = local.lambda_name

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
}

# create archive from file
data "archive_file" "sign_up_lambda" {
  type = "zip"

  source_dir  = "../../../functions/sign-up"
  output_path = "../../../functions/sign-up/__bundle__.zip"
}

# Upload lambda to s3 bucket
resource "aws_s3_object" "sign_up_lambda" {
  bucket = var.s3_bucket_id

  key    = "${var.env}/${var.feature}/sign-up-lambda.zip"
  source = data.archive_file.sign_up_lambda.output_path

  etag = filemd5(data.archive_file.sign_up_lambda.output_path)
}

# Create lambda function
resource "aws_lambda_function" "sign_up_lambda" {
  function_name = local.lambda_name

  runtime = "nodejs16.x"
  handler = "function.handler"

  s3_bucket = var.s3_bucket_id
  s3_key    = aws_s3_object.sign_up_lambda.key

  source_code_hash = data.archive_file.sign_up_lambda.output_base64sha512

  role = aws_iam_role.sign_up_lambda_exec.arn
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "sign_up_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.lambda_name}"

  retention_in_days = 14
}

# Define the Lambda access policy
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    effect  = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem"
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
}

resource "aws_iam_policy" "policy" {
  name        = "${var.env}-auth-api-lambda-sign-up-endpoint"
  description = "Allow /sign-up to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.lambda_policy.json
}

# Attach policy
resource "aws_iam_role_policy_attachment" "sign_up_lambda_policy" {
  role       = aws_iam_role.sign_up_lambda_exec.name
  policy_arn = aws_iam_policy.policy.arn
}

