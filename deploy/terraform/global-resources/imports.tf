data "aws_route53_zone" "primary" {
  name         = "${var.config.hostedZone}."
  private_zone = false
}
