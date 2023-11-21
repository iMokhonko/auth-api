module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name                        = "${var.env}-${var.feature}-${var.config.subdomain}-users-table"
  hash_key                    = "login"
  table_class                 = "STANDARD"
  deletion_protection_enabled = true
  stream_enabled = true
  stream_view_type = "NEW_IMAGE"

  attributes = [
    {
      name = "login"
      type = "S"
    }
  ]

  tags = var.tags
}