variable "env" {
  type = string
  default = "dev"
}

variable "feature" {
  type = string
  default = "master"
}

variable "api_gw_id" {
  type = string
}

variable "sign_up_lambda_invoke_arn" {
  type = string
}

variable "sign_up_lambda_function_name" {
  type = string
}

variable "api_gw_execution_arn" {
  type = string
}