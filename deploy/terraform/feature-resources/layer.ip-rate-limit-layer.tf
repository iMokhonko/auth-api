locals {
  ip_rate_limiter_lambda_layer_name = "${var.env}-${var.feature}-ip-rate-limiter"
}

resource "aws_lambda_layer_version" "ip_rate_limiter_layer" {
  filename   = "ip-rate-limiter-layer.cligenerated.zip"
  layer_name = local.ip_rate_limiter_lambda_layer_name

  compatible_runtimes = ["nodejs18.x"]

  source_code_hash = filebase64sha256("ip-rate-limiter-layer.cligenerated.zip")
}
