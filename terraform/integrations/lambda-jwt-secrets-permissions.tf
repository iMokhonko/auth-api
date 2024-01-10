data "aws_iam_policy_document" "jwt_secret_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [
        var.context.lambdas.sign_in_lambda_role_arn,
        var.context.lambdas.authorizer_lambda_role_arn
      ]
    }

    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.context.secrets_manager.secret_arn]
  }
}

resource "aws_secretsmanager_secret_policy" "example" {
  secret_arn = var.context.secrets_manager.secret_arn
  policy     = data.aws_iam_policy_document.jwt_secret_policy.json
}