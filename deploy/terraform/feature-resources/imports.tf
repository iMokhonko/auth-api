# THIS DATA SHOULD BE CREATED MANUALLY FOR EACH ENV

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

data "aws_subnet" "private_subnet_a" {
  tags = {
    Name = "${var.env}-private-subnet-a"
  }
}


data "aws_subnet" "private_subnet_b" {
  tags = {
    Name = "${var.env}-private-subnet-b"
  }
}

