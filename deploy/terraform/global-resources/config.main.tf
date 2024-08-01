resource "aws_ssm_parameter" "config" {
  name  = "/${var.env}/auth-api"
  type  = "String"
  value = module.route_53_subdomain.dns_address

  tags = var.tags
}
