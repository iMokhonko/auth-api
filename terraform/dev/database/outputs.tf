output "dynamodb_table_arn" {
  value = module.dynamodb_table.dynamodb_table_arn
}

output "dynamo_db_table_name" {
  value = "${var.env}-auth-api-users-table"
}