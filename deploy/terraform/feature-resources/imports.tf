data "aws_ssm_parameter" "jwt_secret" {
  name = var.global_resources.parameterStore.secretName
}
