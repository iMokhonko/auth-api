resource "aws_ssm_parameter" "config" {
  name  = "/${var.env}/auth-api"
  type  = "String"
  value = var.context.dns.dns_address

  tags = var.tags
}