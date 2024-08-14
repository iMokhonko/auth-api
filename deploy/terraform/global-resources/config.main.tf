resource "aws_ssm_parameter" "config" {
  name  = "/${var.env}/auth-api"
  type  = "String"
  value = "${var.config.subdomain}.${var.env}.${var.config.hostedZone}"

  tags = var.tags
}
