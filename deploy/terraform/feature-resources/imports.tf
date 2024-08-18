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

# data "aws_subnet" "private_subnet_a" {
#   tags = {
#     Name = "${var.env}-private-subnet-a"
#   }
# }


# data "aws_subnet" "private_subnet_b" {
#   tags = {
#     Name = "${var.env}-private-subnet-b"
#   }
# }

# data "aws_ssm_parameter" "redis_cache_endpoint_url" {
#   name = "/configuration/global/${var.env}/redis-endpoint-url"
# }


# data "aws_ssm_parameter" "redis_cache_endpoint_port" {
#   name = "/configuration/global/${var.env}/redis-endpoint-port"
# }
