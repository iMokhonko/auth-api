module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name                        = "${var.env}-${var.feature}-${var.config.subdomain}"
  hash_key                    = "pk"
  range_key                   = "sk"
  table_class                 = "STANDARD"
  deletion_protection_enabled = false
  stream_enabled = true
  stream_view_type = "NEW_IMAGE"

  attributes = [
    {
      name = "pk"
      type = "S"
    },
    {
      name = "sk"
      type = "S"
    }
  ]

  tags = var.tags
}