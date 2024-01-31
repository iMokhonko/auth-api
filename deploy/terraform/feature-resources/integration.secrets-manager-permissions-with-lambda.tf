data "aws_iam_policy_document" "jwt_secret_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [
        aws_iam_role.sign_in_lambda_exec.arn,
        aws_iam_role.authorizer_lambda_exec.arn
      ]
    }

    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.global_resources.secretsManager.secretArn]
  }
}

resource "aws_secretsmanager_secret_policy" "policy_attachment" {
  secret_arn = var.global_resources.secretsManager.secretArn
  policy     = data.aws_iam_policy_document.jwt_secret_policy.json
}