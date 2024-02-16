# add
resource "aws_lambda_event_source_mapping" "handle_user_sign_up_integration" {
  event_source_arn  = module.dynamodb_table.dynamodb_table_stream_arn
  function_name     = aws_lambda_function.handle_user_sign_up_lambda.function_name
  starting_position = "TRIM_HORIZON"
}
