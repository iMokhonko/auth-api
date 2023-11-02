data "aws_secretsmanager_random_password" "random_secret_password" {
  password_length = 50
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name_prefix = "${var.env}/jwt-secret-"
  description = "JWT Secret for users JWT tokens"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = data.aws_secretsmanager_random_password.random_secret_password.random_password

  # ignore changes to secret_string
  # this is done in order to prevent replacing secret string when running terraform apply
  lifecycle {
    ignore_changes = [secret_string]
  }
}

data "aws_iam_policy_document" "jwt_secret_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.jwt_secret.arn]
  }
}

resource "aws_secretsmanager_secret_policy" "example" {
  secret_arn = aws_secretsmanager_secret.jwt_secret.arn
  policy     = data.aws_iam_policy_document.jwt_secret_policy.json
}