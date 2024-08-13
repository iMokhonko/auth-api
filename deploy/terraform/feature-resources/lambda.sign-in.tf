locals {
  sign_in_lambda_name = "${var.env}-${var.feature}-auth-api-sign-in"
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

  tags = var.tags
}

# # Create security group
resource "aws_security_group" "auth_api_sign_in_lambda_sg" {
  name        = "auth-api-authorizer-lambda-sg"
  description = "Allow all traffic"
  vpc_id      = data.aws_vpc.vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Create lambda function
resource "aws_lambda_function" "sign_in_lambda" {
  function_name = local.sign_in_lambda_name

  runtime = "nodejs18.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.sign_in_lambda_exec.arn

  environment {
    variables = {
      JWT_SECRET                = data.aws_ssm_parameter.jwt_secret.value,
      GOOGLE_AUTH_CLIENT_ID     = data.aws_ssm_parameter.google_auth_client_id.value
      GOOGLE_AUTH_CLIENT_SECRET = data.aws_ssm_parameter.google_auth_client_secret.value

      REDIS_ENDPOINT = "dev-redis-cache-rwzd07.serverless.euc1.cache.amazonaws.com"
      REDIS_PORT     = "6379"
    }
  }

  vpc_config {
    subnet_ids         = [data.aws_subnet.private_subnet_a.id, data.aws_subnet.private_subnet_b.id]
    security_group_ids = [aws_security_group.auth_api_sign_in_lambda_sg.id]
  }

  layers = [aws_lambda_layer_version.ip_rate_limiter_layer.arn]

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "sign_in_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.sign_in_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "sign_in_lambda_policy" {
  statement {
    effect = "Allow"

    actions = ["dynamodb:GetItem"]

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

  statement {
    effect = "Allow"

    actions = [
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeNetworkInterface",
      "ec2:ModifyNetworkInterfaceAttribute"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "sign_in_policy" {
  name        = "${var.env}-${var.feature}-auth-api-lambda-sign-in"
  description = "Allow /sign-in to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.sign_in_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "sign_in_lambda_policy" {
  role       = aws_iam_role.sign_in_lambda_exec.name
  policy_arn = aws_iam_policy.sign_in_policy.arn
}

# Attach elasticache full access policy
resource "aws_iam_role_policy_attachment" "sign_in_lambda_elasticache_policy" {
  role       = aws_iam_role.sign_in_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess"
}

