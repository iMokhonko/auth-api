terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/secrets-manager.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}

data "aws_secretsmanager_random_password" "random_secret_password" {
  password_length = 50
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.env}/jwt-secret"
  description = "JWT Secret for users JWT tokens"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = data.aws_secretsmanager_random_password.random_secret_password.random_password

  # ignore changes to secret_string
  # this is done in order to prevent replacing secret string when running terraform apply
  lifecycle {
    ignore_changes = [secret_string]
  }
}

data "aws_iam_policy_document" "jwt_secret_policy" {
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.jwt_secret.arn]
  }
}

resource "aws_secretsmanager_secret_policy" "example" {
  secret_arn = aws_secretsmanager_secret.jwt_secret.arn
  policy     = data.aws_iam_policy_document.jwt_secret_policy.json
}