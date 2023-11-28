locals {
  gsi_index_name = "EmailIndex"
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name                        = "${var.env}-${var.feature}-${var.config.subdomain}-users-table"
  hash_key                    = "login"
  table_class                 = "STANDARD"
  deletion_protection_enabled = false
  stream_enabled = true
  stream_view_type = "NEW_IMAGE"

  attributes = [
    {
      name = "login"
      type = "S"
    },
    {
      name = "email"
      type = "S"
    }
  ]

  global_secondary_indexes = [
    {
      name               = local.gsi_index_name
      hash_key           = "email"
      projection_type    = "INCLUDE"
      non_key_attributes = ["login"]
    }
  ]

  tags = var.tags
}