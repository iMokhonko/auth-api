terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "tf-state-backend-imokhonko"
    key    = "auth-api/dev/kms.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
  profile = "default"
}


resource "aws_kms_key" "kms_key" {
  description             = "${var.env}/auth-users-passwords"
  deletion_window_in_days = 7
}

resource "aws_kms_key_policy" "kms_policy" {
  key_id = aws_kms_key.kms_key.id
  policy = jsonencode({
    Statement = [
      {
        Action = "kms:*"
        Effect = "Allow"
        Principal = {
          "AWS": "*"
        }

        Resource = "*"
      },
    ]
    Version = "2012-10-17"
  })
}