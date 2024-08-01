data "aws_secretsmanager_random_password" "random_secret_password" {
  password_length = 50
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${var.env}-auth-api-jwt-secret"
  type  = "String"
  value = data.aws_secretsmanager_random_password.random_secret_password.random_password

  tags = var.tags

  # ignore changes
  # this is done in order to prevent replacing value string when running terraform apply
  lifecycle {
    ignore_changes = [value]
  }
}
