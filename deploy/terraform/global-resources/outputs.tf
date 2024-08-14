output "s3" {
  value = {
    bucketId = aws_s3_bucket.lambdas_bucket.id
  }
}


output "tls_certificate" {
  value = {
    arn = aws_acm_certificate.tls_certificate.arn
  }
}
