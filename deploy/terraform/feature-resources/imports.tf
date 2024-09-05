data "aws_route53_zone" "primary" {
  name         = "${var.config.hostedZone}."
  private_zone = false
}


data "aws_ssm_parameter" "jwt_secret" {
  name = "/secret/auth-api/${var.env}/jwt-secret"
}

data "aws_ssm_parameter" "google_auth_client_id" {
  name = "/secret/auth-api/${var.env}/google-auth-client-id"
}

data "aws_ssm_parameter" "google_auth_client_secret" {
  name = "/secret/auth-api/${var.env}/google-auth-client-secret"
}

data "aws_vpc" "vpc" {
  tags = {
    Name = "${var.env}-vpc"
  }
}
