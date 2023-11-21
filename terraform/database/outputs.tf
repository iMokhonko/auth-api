output "dynamodb_table_arn" {
  value = module.dynamodb_table.dynamodb_table_arn
}

output "dynamo_db_table_name" {
  value = "${var.env}-${var.feature}-${var.config.subdomain}-users-table"
}

output "dynamo_db_table_stream_arn" {
  value = module.dynamodb_table.dynamodb_table_stream_arn
}