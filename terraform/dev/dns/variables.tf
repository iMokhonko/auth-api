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