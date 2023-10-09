output "secretsmanager_secret_id" {
  value = aws_secretsmanager_secret_version.jwt_secret.id
}