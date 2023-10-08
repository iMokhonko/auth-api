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

variable "route53_zone_id" {
  type = string
}

variable "acm_master_certificate_arn" {
  type = string
}

variable "acm_features_certificate_arn" {
  type = string
}

variable "api_endpoint_url" {
  type = string
}