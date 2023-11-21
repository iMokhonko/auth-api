# add
resource "aws_lambda_event_source_mapping" "handle_user_register_integration" {
  event_source_arn  = var.context.database.dynamo_db_table_stream_arn
  function_name     = var.context.lambdas.handle_user_register_function_name
  starting_position = "TRIM_HORIZON"
}
