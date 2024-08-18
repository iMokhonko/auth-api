locals {
  sign_up_lambda_name = "${var.env}-${var.feature}-auth-api-sign-up"
}

# Create iam role
resource "aws_iam_role" "sign_up_lambda_exec" {
  name = local.sign_up_lambda_name

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

# Create security group
resource "aws_security_group" "auth_api_sign_up_lambda_sg" {
  name        = "auth-api-sign-up-lambda-sg"
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
resource "aws_lambda_function" "sign_up_lambda" {
  function_name = local.sign_up_lambda_name

  runtime = "nodejs18.x"
  handler = "function.handler"

  filename = "dummy.zip"

  role = aws_iam_role.sign_up_lambda_exec.arn

  # environment {
  #   variables = {
  #     REDIS_ENDPOINT = data.aws_ssm_parameter.redis_cache_endpoint_url.value
  #     REDIS_PORT     = data.aws_ssm_parameter.redis_cache_endpoint_port.value
  #   }
  # }

  # vpc_config {
  #   subnet_ids         = [data.aws_subnet.private_subnet_a.id, data.aws_subnet.private_subnet_b.id]
  #   security_group_ids = [aws_security_group.auth_api_sign_up_lambda_sg.id]
  # }

  # layers = [aws_lambda_layer_version.ip_rate_limiter_layer.arn]

  tags = var.tags
}

# Create log group for lambda
resource "aws_cloudwatch_log_group" "sign_up_lambda_cloudwatch_log_group" {
  name = "/aws/lambda/${local.sign_up_lambda_name}"

  retention_in_days = 14

  tags = var.tags
}

# Define the Lambda access policy
data "aws_iam_policy_document" "sign_up_lambda_policy" {
  statement {
    effect = "Allow"

    actions = ["dynamodb:PutItem"]

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

  # statement {
  #   effect = "Allow"

  #   actions = [
  #     "ec2:DescribeNetworkInterfaces",
  #     "ec2:CreateNetworkInterface",
  #     "ec2:DeleteNetworkInterface",
  #     "ec2:DescribeNetworkInterface",
  #     "ec2:ModifyNetworkInterfaceAttribute"
  #   ]

  #   resources = ["*"]
  # }
}

resource "aws_iam_policy" "sign_up_policy" {
  name        = "${var.env}-${var.feature}-auth-api-lambda-sign-up"
  description = "Allow /sign-up to add logs to cloudwatch and access DynamoDB table"
  policy      = data.aws_iam_policy_document.sign_up_lambda_policy.json

  tags = var.tags
}

# Attach policy
resource "aws_iam_role_policy_attachment" "sign_up_lambda_policy" {
  role       = aws_iam_role.sign_up_lambda_exec.name
  policy_arn = aws_iam_policy.sign_up_policy.arn
}


# Attach elasticache full access policy
# resource "aws_iam_role_policy_attachment" "sign_up_lambda_elasticache_policy" {
#   role       = aws_iam_role.sign_up_lambda_exec.name
#   policy_arn = "arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess"
# }

