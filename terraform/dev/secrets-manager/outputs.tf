output "secret_name" {
  value = "${var.env}/jwt-secret"
}

output "secret_arn" {
  value = aws_secretsmanager_secret.jwt_secret.arn
}