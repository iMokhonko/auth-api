resource "aws_kms_key" "kms_key" {
  description             = "${var.env}/auth-users-passwords"
  deletion_window_in_days = 7

  tags = var.tags
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