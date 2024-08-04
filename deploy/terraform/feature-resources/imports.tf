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
