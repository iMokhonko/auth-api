# resource "aws_security_group" "elasticache_sg" {
#   name        = "elasticache-sg"
#   description = "Allow All traffic"
#   vpc_id      = aws_vpc.auth_api_backend_vpc.id

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   ingress {
#     from_port   = 6379
#     to_port     = 6379
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# }

# resource "aws_elasticache_serverless_cache" "redis_adapter" {
#   engine = "redis"
#   name   = "${var.env}-auth-api-cache"
#   cache_usage_limits {
#     data_storage {
#       maximum = 10
#       unit    = "GB"
#     }
#     ecpu_per_second {
#       maximum = 5000
#     }
#   }
#   security_group_ids = [aws_security_group.elasticache_sg.id]

#   subnet_ids = [
#     aws_subnet.auth_api_private_subnet_a.id,
#     aws_subnet.auth_api_private_subnet_b.id
#   ]
# }

