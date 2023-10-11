variable "env" {
  type = string
  default = "dev"
}

variable "feature" {
  type = string
  default = "master"
}

variable "s3_bucket_id" {
  type = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "secret_arn" {
  type = string
}