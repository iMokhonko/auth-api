variable "dns_service_name" {
  type = string
  default = "auth-api"
}

variable "hosted_zone" {
  type = string
  default = "imokhonko.com"
}

variable "env" {
  type = string
  default = "dev"
}

variable "feature" {
  type = string
  default = "master"
}

variable "context" {
  type = any
}

variable "tags" {
  type = any
}