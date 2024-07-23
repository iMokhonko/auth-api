data "aws_secretsmanager_random_password" "random_secret_password" {
  password_length = 50
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name_prefix = "${var.env}/${var.config.subdomain}/auth-api-jwt-secret-"
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
