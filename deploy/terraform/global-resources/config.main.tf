resource "aws_ssm_parameter" "config" {
  name  = "/${var.env}/${var.config.subdomain}"
  type  = "String"
  value = module.route_53_subdomain.dns_address

  tags = var.tags
}