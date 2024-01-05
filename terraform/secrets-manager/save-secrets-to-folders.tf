resource "null_resource" "save_secret_to_authorizer" {
  triggers = {
    uuid = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOF
      echo '{ "jwtSecretBase64Encoded": "${base64encode(aws_secretsmanager_secret_version.jwt_secret.secret_string)}"}' > ../../functions/authorizer/jwt-secret.cligenerated.json
    EOF
  }
}

resource "null_resource" "save_secret_to_sign_in" {
  triggers = {
    uuid = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOF
      echo '{ "jwtSecretBase64Encoded": "${base64encode(aws_secretsmanager_secret_version.jwt_secret.secret_string)}"}' > ../../functions/sign-in/jwt-secret.cligenerated.json
    EOF
  }
}

resource "null_resource" "save_secret_to_refresh_token" {
  triggers = {
    uuid = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOF
      echo '{ "jwtSecretBase64Encoded": "${base64encode(aws_secretsmanager_secret_version.jwt_secret.secret_string)}"}' > ../../functions/refresh-token/jwt-secret.cligenerated.json
    EOF
  }
}