# Create subdomain records
module "route_53_subdomain" {
  source = "../../../terraform-modules/web-ui/route_53_subdomain"

  env = var.env
  dns_service_name = var.config.subdomain
  hosted_zone = var.config.hostedZone
}