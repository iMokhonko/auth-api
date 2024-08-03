locals {
  authorizer_lambda_name = "${var.env}-${var.feature}-auth-api-authorizer"
}

# Create iam role
resource "aws_iam_role" "authorizer_lambda_exec" {
  name = local.authorizer_lambda_name

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
resource "aws_security_group" "auth_api_authorizer_lambda_sg" {
  name        = "auth-api-authorizer-lambda-sg"
  description = "Allow all traffic"
  vpc_id      = var.global_resources.vpc.id

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
resource "aws_lambda_function" "authorizer_lambda" {
  function_name = local.authorizer_lambda_name

  runtime = "nodejs18.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.authorizer_lambda_exec.arn

  vpc_config {
    subnet_ids         = [var.global_resources.vpc.privateSubnetA, var.global_resources.vpc.privateSubnetB]
    security_group_ids = [aws_security_group.auth_api_authorizer_lambda_sg.id]
  }

  environment {
    variables = {
      JWT_SECRET = data.aws_ssm_parameter.jwt_secret.value
    }
  }

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "authorizer_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.authorizer_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "authorizer_lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }

  # statement {
  #   effect = "Allow"

  #   actions = ["ssm:GetParameter"]

  #   resources = [var.global_resources.parameterStore.secretArn]
  # }

  statement {
    effect = "Allow"

    actions = [
      "elasticache:*",
      "ec2:DescribeNetworkInterfaces",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface",
      "ec2:DescribeNetworkInterface",
      "ec2:ModifyNetworkInterfaceAttribute"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "authorizer_policy" {
  name        = "${var.env}-${var.feature}-auth-api-lambda-authorizer"
  description = "Authorizer for API endpoints"
  policy      = data.aws_iam_policy_document.authorizer_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "authorizer_lambda_policy" {
  role       = aws_iam_role.authorizer_lambda_exec.name
  policy_arn = aws_iam_policy.authorizer_policy.arn
}

# Attach policy elasticache polic
resource "aws_iam_role_policy_attachment" "authorizer_lambda_elasticache_policy" {
  role       = aws_iam_role.authorizer_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess"
}
