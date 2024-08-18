locals {
  rate_limiters_lambda_layer_name = "${var.env}-${var.feature}-rate-limiters"
}

resource "aws_lambda_layer_version" "rate_limiters_layer" {
  filename   = "rate-limiters-layer.cligenerated.zip"
  layer_name = local.rate_limiters_lambda_layer_name

  compatible_runtimes = ["nodejs18.x"]

  source_code_hash = filebase64sha256("rate-limiters-layer.cligenerated.zip")
}

data "aws_iam_policy_document" "token_rate_limiter_policy" {
  statement {
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem"
    ]

    resources = [module.dynamodb_table.dynamodb_table_arn]
  }
}

resource "aws_iam_policy" "token_rate_limiter_policy" {
  name        = "${var.env}-${var.feature}-auth-api-token-rate-limiter-policy"
  description = "Allow GetItem, PutItem, UpdateItem for rate limits"
  policy      = data.aws_iam_policy_document.token_rate_limiter_policy.json

  tags = var.tags
}
